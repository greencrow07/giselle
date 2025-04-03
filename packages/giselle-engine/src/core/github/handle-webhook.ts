import {
	type OverrideNode,
	WorkspaceGitHubIntegrationNextActionDiscussionCommentCreate,
	WorkspaceGitHubIntegrationNextActionIssueCommentCreate,
	WorkspaceGitHubIntegrationNextActionPullRequestCommentCreate,
	type WorkspaceGitHubIntegrationPayloadField,
	type WorkspaceGitHubIntegrationSetting,
} from "@giselle-sdk/data-type";
import { z } from "zod";
import { WorkflowError } from "../error";
import { runApi } from "../runs";
import type { GiselleEngineContext } from "../types";
import { getWorkspace } from "../workspaces";
import {
	type GitHubEvent,
	GitHubEventType,
	determineGitHubEvent,
} from "./events";
import {
	type Command,
	getWorkspaceGitHubIntegrationRepositorySettings,
	parseCommand as parseCommandInternal,
} from "./utils";

export const IssueCommentCreateAction = z.object({
	action: WorkspaceGitHubIntegrationNextActionIssueCommentCreate,
	issue: z.object({
		repo: z.object({
			owner: z.string(),
			name: z.string(),
		}),
		number: z.number(),
	}),
	content: z.string(),
});
type IssueCommentCreateAction = z.infer<typeof IssueCommentCreateAction>;
export const PullRequestCommentCreateAction = z.object({
	action: WorkspaceGitHubIntegrationNextActionPullRequestCommentCreate,
	pullRequest: z.object({
		repo: z.object({
			owner: z.string(),
			name: z.string(),
		}),
		number: z.number(),
	}),
	content: z.string(),
});
type PullRequestCommentCreateAction = z.infer<
	typeof PullRequestCommentCreateAction
>;
export const DiscussionCommentCreateAction = z.object({
	action: WorkspaceGitHubIntegrationNextActionDiscussionCommentCreate,
	discussion: z.object({
		nodeId: z.string(),
	}),
	replyToId: z.string().optional(),
	content: z.string(),
});
type DiscussionCommentCreateAction = z.infer<
	typeof DiscussionCommentCreateAction
>;

export const HandleGitHubWebhookResult = z.discriminatedUnion("action", [
	IssueCommentCreateAction,
	PullRequestCommentCreateAction,
	DiscussionCommentCreateAction,
]);
export type HandleGitHubWebhookResult = z.infer<
	typeof HandleGitHubWebhookResult
>;

type PullRequestDiffFn = (
	owner: string,
	repo: string,
	number: number,
) => Promise<string>;
export interface HandleGitHubWebhookOptions {
	pullRequestDiff?: PullRequestDiffFn;
	addReactionToIssueComment?: (
		owner: string,
		repo: string,
		commentId: number,
	) => Promise<void>;
	addReactionToIssue?: (
		owner: string,
		repo: string,
		issueId: number,
	) => Promise<void>;
	addReactionToNode?: (nodeId: string) => Promise<void>;
}
export interface HandleGitHubWebhookArgs {
	github: {
		event: string;
		delivery: string;
		payload: unknown;
	};
	context: GiselleEngineContext;
	options?: HandleGitHubWebhookOptions;
}

export async function handleWebhook(args: HandleGitHubWebhookArgs) {
	const gitHubEvent = determineGitHubEvent(
		args.github.event,
		args.github.payload,
	);
	if (!gitHubEvent) {
		throw new Error("Unsupported event");
	}

	const repository = getRepositoryInfo(gitHubEvent);
	const workspaceGitHubIntegrationRepositorySettings =
		await getWorkspaceGitHubIntegrationRepositorySettings({
			storage: args.context.storage,
			repositoryNodeId: repository.nodeId,
		});

	const matchedIntegrationSettings =
		workspaceGitHubIntegrationRepositorySettings?.filter((setting) =>
			isMatchingIntegrationSetting(setting, gitHubEvent),
		) ?? [];

	const integrationPromises = matchedIntegrationSettings.map((setting) =>
		processIntegration(
			setting,
			gitHubEvent,
			repository,
			args.context,
			args.options,
		),
	);
	const results = await Promise.all(integrationPromises);
	return results.flat();
}

async function processIntegration(
	setting: WorkspaceGitHubIntegrationSetting,
	gitHubEvent: GitHubEvent,
	repository: { owner: string; name: string; nodeId: string },
	context: GiselleEngineContext,
	options?: HandleGitHubWebhookOptions,
): Promise<HandleGitHubWebhookResult[]> {
	await handleReaction(gitHubEvent, options);

	const command = parseCommandFromEvent(gitHubEvent);

	const overrideNodes: OverrideNode[] = [];
	const workspace = await getWorkspace({
		context: context,
		workspaceId: setting.workspaceId,
	});
	for (const payloadMap of setting.payloadMaps) {
		const node = workspace.nodes.find((node) => node.id === payloadMap.nodeId);
		if (node === undefined) {
			continue;
		}
		const payloadValue = await getPayloadValue(
			gitHubEvent,
			payloadMap.payload,
			command?.content,
			options?.pullRequestDiff,
		);
		switch (node.content.type) {
			case "textGeneration":
				overrideNodes.push({
					id: node.id,
					type: "action",
					content: {
						type: node.content.type,
						prompt: `${payloadValue}`,
					},
				});
				break;
			case "imageGeneration":
				overrideNodes.push({
					id: node.id,
					type: "action",
					content: {
						type: node.content.type,
						prompt: `${payloadValue}`,
					},
				});
				break;
			case "file":
				throw new Error("File nodes are not supported");
			case "text":
				overrideNodes.push({
					id: node.id,
					type: "variable",
					content: {
						type: node.content.type,
						text: `${payloadValue}`,
					},
				});
				break;
			case "github":
				throw new Error("GitHub nodes are not supported");
			default: {
				const _exhaustiveCheck: never = node.content;
				throw new Error(`Unhandled node type: ${_exhaustiveCheck}`);
			}
		}
	}
	const workflows = workspace.editingWorkflows.filter((workflow) =>
		workflow.jobs.some((job) =>
			job.actions.some((action) =>
				overrideNodes.some(
					(overrideNode) =>
						overrideNode.id === action.node.id ||
						action.generationTemplate.sourceNodes.some(
							(sourceNode) => sourceNode.id === overrideNode.id,
						),
				),
			),
		),
	);
	const results = await Promise.all(
		workflows.map((workflow) =>
			runApi({
				context,
				workspaceId: workspace.id,
				workflowId: workflow.id,
				overrideNodes,
			}).catch((error: unknown) => {
				throw new WorkflowError(
					`Failed to run workflow: ${error}`,
					workspace.id,
					workflow.id,
					{ cause: error },
				);
			}),
		),
	);

	const webhookResults: HandleGitHubWebhookResult[] = [];
	for (const result of results) {
		for (const resultText of result) {
			switch (setting.nextAction) {
				case "github.issue_comment.create": {
					let issueNumber: number;
					if ("issue" in gitHubEvent.payload) {
						issueNumber = gitHubEvent.payload.issue.number;
					} else {
						throw new Error(
							`${setting.nextAction} is not supported for ${gitHubEvent.type}`,
						);
					}

					webhookResults.push({
						action: "github.issue_comment.create",
						issue: {
							repo: {
								owner: repository.owner,
								name: repository.name,
							},
							number: issueNumber,
						},
						content: resultText,
					});
					break;
				}
				case "github.pull_request_comment.create": {
					let pullRequestNumber: number;

					if ("issue" in gitHubEvent.payload) {
						// Some GitHub events treats pull requests as issues.
						pullRequestNumber = gitHubEvent.payload.issue.number;
					} else if ("pull_request" in gitHubEvent.payload) {
						pullRequestNumber = gitHubEvent.payload.pull_request.number;
					} else {
						throw new Error(
							`${setting.nextAction} is not supported for ${gitHubEvent.type}`,
						);
					}

					webhookResults.push({
						action: "github.pull_request_comment.create",
						pullRequest: {
							repo: {
								owner: repository.owner,
								name: repository.name,
							},
							number: pullRequestNumber,
						},
						content: resultText,
					});
					break;
				}
				case "github.discussion_comment.create": {
					let discussionNodeId: string;
					if ("discussion" in gitHubEvent.payload) {
						discussionNodeId = gitHubEvent.payload.discussion.node_id;
					} else {
						throw new Error(
							`${setting.nextAction} is not supported for ${gitHubEvent.type}`,
						);
					}
					let replyToId: string | undefined;
					if ("comment" in gitHubEvent.payload) {
						replyToId = gitHubEvent.payload.comment.node_id;
					}
					webhookResults.push({
						action: "github.discussion_comment.create",
						discussion: {
							nodeId: discussionNodeId,
						},
						replyToId,
						content: resultText,
					});
					break;
				}
				default: {
					const _exhaustiveCheck: never = setting.nextAction;
					throw new Error(`Unhandled action type: ${_exhaustiveCheck}`);
				}
			}
		}
	}
	return webhookResults;
}

export function isMatchingIntegrationSetting(
	setting: WorkspaceGitHubIntegrationSetting,
	event: GitHubEvent,
): boolean {
	const command = parseCommandFromEvent(event);

	switch (setting.event) {
		case "github.issue_comment.created":
		case "github.pull_request_comment.created":
			return (
				event.type === GitHubEventType.ISSUE_COMMENT_CREATED &&
				setting.callsign !== null &&
				setting.callsign === command?.callsign
			);
		case "github.issues.opened":
			return event.type === GitHubEventType.ISSUES_OPENED;
		case "github.issues.closed":
			return event.type === GitHubEventType.ISSUES_CLOSED;
		case "github.pull_request.opened":
			return event.type === GitHubEventType.PULL_REQUEST_OPENED;
		case "github.pull_request.ready_for_review":
			return event.type === GitHubEventType.PULL_REQUEST_READY_FOR_REVIEW;
		case "github.pull_request.closed":
			return event.type === GitHubEventType.PULL_REQUEST_CLOSED;
		case "github.discussion.created":
			return event.type === GitHubEventType.DISCUSSION_CREATED;
		case "github.discussion.closed":
			return event.type === GitHubEventType.DISCUSSION_CLOSED;
		case "github.discussion_comment.created":
			return (
				event.type === GitHubEventType.DISCUSSION_COMMENT_CREATED &&
				setting.callsign !== null &&
				setting.callsign === command?.callsign
			);
		default: {
			const _exhaustiveCheck: never = setting.event;
			throw new Error(`Unhandled setting event type: ${_exhaustiveCheck}`);
		}
	}
}

async function handleReaction(
	event: GitHubEvent,
	options?: HandleGitHubWebhookOptions,
) {
	if (!options) {
		return;
	}

	switch (event.type) {
		case GitHubEventType.ISSUE_COMMENT_CREATED:
			await options.addReactionToIssueComment?.(
				event.payload.repository.owner.login,
				event.payload.repository.name,
				event.payload.comment.id,
			);
			break;
		case GitHubEventType.ISSUES_OPENED:
		case GitHubEventType.ISSUES_CLOSED:
			await options.addReactionToIssue?.(
				event.payload.repository.owner.login,
				event.payload.repository.name,
				event.payload.issue.id,
			);
			break;

		case GitHubEventType.PULL_REQUEST_OPENED:
		case GitHubEventType.PULL_REQUEST_READY_FOR_REVIEW:
		case GitHubEventType.PULL_REQUEST_CLOSED:
			// Pull request are treated as issue.
			await options.addReactionToIssue?.(
				event.payload.repository.owner.login,
				event.payload.repository.name,
				event.payload.pull_request.id,
			);
			break;

		case GitHubEventType.DISCUSSION_CREATED:
		case GitHubEventType.DISCUSSION_CLOSED:
			await options.addReactionToNode?.(event.payload.discussion.node_id);
			break;

		case GitHubEventType.DISCUSSION_COMMENT_CREATED:
			await options.addReactionToNode?.(event.payload.comment.node_id);
			break;

		default: {
			const _exhaustiveCheck: never = event;
			throw new Error(`Unhandled event type for reaction: ${_exhaustiveCheck}`);
		}
	}
}

async function getPayloadValue(
	event: GitHubEvent,
	field: WorkspaceGitHubIntegrationPayloadField,
	command?: string,
	diff?: PullRequestDiffFn,
): Promise<string | number> {
	switch (event.type) {
		case GitHubEventType.ISSUE_COMMENT_CREATED:
			// Pull request comments are treated as issue comments.
			switch (field) {
				case "github.pull_request_comment.pull_request.title":
				case "github.issue_comment.issue.title":
					return event.payload.issue.title;
				case "github.pull_request_comment.pull_request.diff": {
					if (event.payload.issue.pull_request == null) {
						throw new Error(
							"Attempted to get diff for non-pull-request issue comment",
						);
					}
					const diffResult = await diff?.(
						event.payload.repository.owner.login,
						event.payload.repository.name,
						event.payload.issue.number,
					);
					return diffResult ?? "";
				}
				case "github.pull_request_comment.pull_request.body":
				case "github.issue_comment.issue.body":
					return event.payload.issue.body ?? "";
				case "github.issue_comment.body":
				case "github.pull_request_comment.body":
					return command ?? "";
				case "github.issue_comment.issue.number":
				case "github.pull_request_comment.pull_request.number":
					return event.payload.issue.number;
				case "github.issue_comment.issue.repository.owner":
				case "github.pull_request_comment.pull_request.repository.owner":
					return event.payload.repository.owner.login;
				case "github.pull_request_comment.pull_request.repository.name":
				case "github.issue_comment.issue.repository.name":
					return event.payload.repository.name;
				default: {
					throw new Error(
						`Unhandled field type: ${field} for event ${event.type}`,
					);
				}
			}

		case GitHubEventType.ISSUES_OPENED:
		case GitHubEventType.ISSUES_CLOSED:
			switch (field) {
				case "github.issues.title":
					return event.payload.issue.title;
				case "github.issues.body":
					return event.payload.issue.body ?? "";
				default: {
					throw new Error(
						`Unhandled field type: ${field} for event ${event.type}`,
					);
				}
			}

		case GitHubEventType.PULL_REQUEST_OPENED:
		case GitHubEventType.PULL_REQUEST_READY_FOR_REVIEW:
		case GitHubEventType.PULL_REQUEST_CLOSED:
			switch (field) {
				case "github.pull_request.title":
					return event.payload.pull_request.title;
				case "github.pull_request.body":
					return event.payload.pull_request.body ?? "";
				case "github.pull_request.diff": {
					const diffResult = await diff?.(
						event.payload.repository.owner.login,
						event.payload.repository.name,
						event.payload.pull_request.number,
					);
					return diffResult ?? "";
				}
				default: {
					throw new Error(
						`Unhandled field type: ${field} for event ${event.type}`,
					);
				}
			}

		case GitHubEventType.DISCUSSION_CREATED:
		case GitHubEventType.DISCUSSION_CLOSED:
			switch (field) {
				case "github.discussion.title":
					return event.payload.discussion.title;
				case "github.discussion.body":
					return event.payload.discussion.body ?? "";
				default: {
					throw new Error(
						`Unhandled field type: ${field} for event ${event.type}`,
					);
				}
			}

		case GitHubEventType.DISCUSSION_COMMENT_CREATED:
			switch (field) {
				case "github.discussion_comment.discussion.title":
					return event.payload.discussion.title;
				case "github.discussion_comment.discussion.body":
					return event.payload.discussion.body ?? "";
				case "github.discussion_comment.body":
					return command ?? "";
				case "github.discussion_comment.discussion.number":
					return event.payload.discussion.number;
				case "github.discussion_comment.discussion.repository.owner":
					return event.payload.repository.owner.login;
				case "github.discussion_comment.discussion.repository.name":
					return event.payload.repository.name;
				default: {
					throw new Error(
						`Unhandled field type: ${field} for event ${event.type}`,
					);
				}
			}

		default: {
			const _exhaustiveCheckEvent: never = event;
			throw new Error(`Unhandled event type: ${_exhaustiveCheckEvent}`);
		}
	}
}

function getRepositoryInfo(event: GitHubEvent) {
	return {
		owner: event.payload.repository.owner.login,
		name: event.payload.repository.name,
		nodeId: event.payload.repository.node_id,
	};
}

function parseCommandFromEvent(event: GitHubEvent): Command | null {
	if (
		event.type !== GitHubEventType.ISSUE_COMMENT_CREATED &&
		event.type !== GitHubEventType.DISCUSSION_COMMENT_CREATED
	) {
		return null;
	}
	return parseCommandInternal(event.payload.comment.body);
}
