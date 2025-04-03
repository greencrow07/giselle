import { createIdGenerator } from "@giselle-sdk/utils";
import { z } from "zod";
import { WorkspaceId } from "..";
import { NodeId } from "../../node";

export const WorkspaceGitHubIntegrationId = createIdGenerator("wrkgth");
export type WorkspaceGitHubIntegrationId =
	typeof WorkspaceGitHubIntegrationId.schema;

export const WorkspaceGitHubIntegrationTrigger = z.enum([
	"github.issues.opened",
	"github.issues.closed",
	"github.issue_comment.created",
	"github.pull_request_comment.created",
	"github.pull_request.opened",
	"github.pull_request.ready_for_review",
	"github.pull_request.closed",
	"github.discussion.created",
	"github.discussion_comment.created",
	"github.discussion.closed",
]);
export type WorkspaceGitHubIntegrationTrigger = z.infer<
	typeof WorkspaceGitHubIntegrationTrigger
>;

export const WorkspaceGitHubIntegrationNextActionIssueCommentCreate = z.literal(
	"github.issue_comment.create",
);
export const WorkspaceGitHubIntegrationNextActionPullRequestCommentCreate =
	z.literal("github.pull_request_comment.create");
export const WorkspaceGitHubIntegrationNextActionDiscussionCommentCreate =
	z.literal("github.discussion_comment.create");

export const WorkspaceGitHubIntegrationNextAction = z.enum([
	WorkspaceGitHubIntegrationNextActionIssueCommentCreate._def.value,
	WorkspaceGitHubIntegrationNextActionPullRequestCommentCreate._def.value,
	WorkspaceGitHubIntegrationNextActionDiscussionCommentCreate._def.value,
]);
export type WorkspaceGitHubNextIntegrationAction = z.infer<
	typeof WorkspaceGitHubIntegrationNextAction
>;

export const WorkspaceGitHubIntegrationPayloadField = z.enum([
	"github.issues.title",
	"github.issues.body",
	"github.issue_comment.issue.number",
	"github.issue_comment.issue.repository.owner",
	"github.issue_comment.issue.repository.name",
	"github.issue_comment.body",
	"github.issue_comment.issue.title",
	"github.issue_comment.issue.body",
	"github.pull_request_comment.pull_request.number",
	"github.pull_request_comment.pull_request.repository.owner",
	"github.pull_request_comment.pull_request.repository.name",
	"github.pull_request_comment.pull_request.title",
	"github.pull_request_comment.pull_request.body",
	"github.pull_request_comment.body",
	"github.pull_request_comment.pull_request.diff",
	"github.pull_request.title",
	"github.pull_request.body",
	"github.pull_request.diff",
	"github.discussion.title",
	"github.discussion.body",
	"github.discussion_comment.discussion.number",
	"github.discussion_comment.discussion.repository.owner",
	"github.discussion_comment.discussion.repository.name",
	"github.discussion_comment.body",
	"github.discussion_comment.discussion.title",
	"github.discussion_comment.discussion.body",
]);
export type WorkspaceGitHubIntegrationPayloadField = z.infer<
	typeof WorkspaceGitHubIntegrationPayloadField
>;

export const WorkspaceGitHubIntegrationPayloadNodeMap = z.object({
	payload: WorkspaceGitHubIntegrationPayloadField,
	nodeId: NodeId.schema,
});
export type WorkspaceGitHubIntegrationPayloadNodeMap = z.infer<
	typeof WorkspaceGitHubIntegrationPayloadNodeMap
>;

export const WorkspaceGitHubIntegrationSetting = z.object({
	id: WorkspaceGitHubIntegrationId.schema,
	workspaceId: WorkspaceId.schema,
	repositoryNodeId: z.string(),
	callsign: z.string().nullable(),
	event: WorkspaceGitHubIntegrationTrigger,
	payloadMaps: z.array(WorkspaceGitHubIntegrationPayloadNodeMap),
	nextAction: WorkspaceGitHubIntegrationNextAction,
});
export type WorkspaceGitHubIntegrationSetting = z.infer<
	typeof WorkspaceGitHubIntegrationSetting
>;
