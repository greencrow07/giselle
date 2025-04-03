import type {
	DiscussionCommentCreatedEvent,
	DiscussionCreatedEvent,
	IssueCommentCreatedEvent,
	IssuesClosedEvent,
	IssuesOpenedEvent,
	PullRequestClosedEvent,
	PullRequestOpenedEvent,
	PullRequestReadyForReviewEvent,
} from "@octokit/webhooks-types";
import type { DiscussionClosedEvent } from "./discussion-types";
import { type GitHubEvent, GitHubEventType } from "./types";

function isIssueCommentCreatedPayload(
	event: string,
	payload: unknown,
): payload is IssueCommentCreatedEvent {
	return (
		event === "issue_comment" &&
		typeof payload === "object" &&
		payload !== null &&
		"action" in payload &&
		payload.action === "created" &&
		"comment" in payload &&
		typeof payload.comment === "object" &&
		payload.comment !== null &&
		"repository" in payload &&
		typeof payload.repository === "object" &&
		payload.repository !== null
	);
}

function isIssuesOpenedPayload(
	event: string,
	payload: unknown,
): payload is IssuesOpenedEvent {
	return (
		event === "issues" &&
		typeof payload === "object" &&
		payload !== null &&
		"action" in payload &&
		payload.action === "opened" &&
		"issue" in payload &&
		typeof payload.issue === "object" &&
		payload.issue !== null &&
		"repository" in payload &&
		typeof payload.repository === "object" &&
		payload.repository !== null
	);
}

function isIssuesClosedPayload(
	event: string,
	payload: unknown,
): payload is IssuesClosedEvent {
	return (
		event === "issues" &&
		typeof payload === "object" &&
		payload !== null &&
		"action" in payload &&
		payload.action === "closed" &&
		"issue" in payload &&
		typeof payload.issue === "object" &&
		payload.issue !== null &&
		"repository" in payload &&
		typeof payload.repository === "object" &&
		payload.repository !== null
	);
}

function isPullRequestOpenedPayload(
	event: string,
	payload: unknown,
): payload is PullRequestOpenedEvent {
	return (
		event === "pull_request" &&
		typeof payload === "object" &&
		payload !== null &&
		"action" in payload &&
		payload.action === "opened" &&
		"pull_request" in payload &&
		typeof payload.pull_request === "object" &&
		payload.pull_request !== null &&
		"repository" in payload &&
		typeof payload.repository === "object" &&
		payload.repository !== null
	);
}

function isPullRequestReadyForReviewPayload(
	event: string,
	payload: unknown,
): payload is PullRequestReadyForReviewEvent {
	return (
		event === "pull_request" &&
		typeof payload === "object" &&
		payload !== null &&
		"action" in payload &&
		payload.action === "ready_for_review" &&
		"pull_request" in payload &&
		typeof payload.pull_request === "object" &&
		payload.pull_request !== null &&
		"repository" in payload &&
		typeof payload.repository === "object" &&
		payload.repository !== null
	);
}

function isPullRequestClosedPayload(
	event: string,
	payload: unknown,
): payload is PullRequestClosedEvent {
	return (
		event === "pull_request" &&
		typeof payload === "object" &&
		payload !== null &&
		"action" in payload &&
		payload.action === "closed" &&
		"pull_request" in payload &&
		typeof payload.pull_request === "object" &&
		payload.pull_request !== null &&
		"repository" in payload &&
		typeof payload.repository === "object" &&
		payload.repository !== null
	);
}

function isDiscussionCreatedPayload(
	event: string,
	payload: unknown,
): payload is DiscussionCreatedEvent {
	return (
		event === "discussion" &&
		typeof payload === "object" &&
		payload !== null &&
		"action" in payload &&
		payload.action === "created" &&
		"discussion" in payload &&
		typeof payload.discussion === "object" &&
		payload.discussion !== null &&
		"repository" in payload &&
		typeof payload.repository === "object" &&
		payload.repository !== null
	);
}

function isDiscussionCommentCreatedPayload(
	event: string,
	payload: unknown,
): payload is DiscussionCommentCreatedEvent {
	return (
		event === "discussion_comment" &&
		typeof payload === "object" &&
		payload !== null &&
		"action" in payload &&
		payload.action === "created" &&
		"comment" in payload &&
		typeof payload.comment === "object" &&
		payload.comment !== null &&
		"repository" in payload &&
		typeof payload.repository === "object" &&
		payload.repository !== null
	);
}

function isDiscussionClosedPayload(
	event: string,
	payload: unknown,
): payload is DiscussionClosedEvent {
	return (
		event === "discussion" &&
		typeof payload === "object" &&
		payload !== null &&
		"action" in payload &&
		payload.action === "closed" &&
		"discussion" in payload &&
		typeof payload.discussion === "object" &&
		payload.discussion !== null &&
		"repository" in payload &&
		typeof payload.repository === "object" &&
		payload.repository !== null
	);
}

export function determineGitHubEvent(
	event: string,
	payload: unknown,
): GitHubEvent | null {
	if (isIssueCommentCreatedPayload(event, payload)) {
		return {
			type: GitHubEventType.ISSUE_COMMENT_CREATED,
			event: "issue_comment",
			payload,
		};
	}

	if (isIssuesOpenedPayload(event, payload)) {
		return {
			type: GitHubEventType.ISSUES_OPENED,
			event: "issues",
			payload,
		};
	}

	if (isIssuesClosedPayload(event, payload)) {
		return {
			type: GitHubEventType.ISSUES_CLOSED,
			event: "issues",
			payload,
		};
	}

	if (isPullRequestOpenedPayload(event, payload)) {
		return {
			type: GitHubEventType.PULL_REQUEST_OPENED,
			event: "pull_request",
			payload,
		};
	}

	if (isPullRequestReadyForReviewPayload(event, payload)) {
		return {
			type: GitHubEventType.PULL_REQUEST_READY_FOR_REVIEW,
			event: "pull_request",
			payload,
		};
	}

	if (isPullRequestClosedPayload(event, payload)) {
		return {
			type: GitHubEventType.PULL_REQUEST_CLOSED,
			event: "pull_request",
			payload,
		};
	}

	if (isDiscussionCreatedPayload(event, payload)) {
		return {
			type: GitHubEventType.DISCUSSION_CREATED,
			event: "discussion",
			payload,
		};
	}

	if (isDiscussionCommentCreatedPayload(event, payload)) {
		return {
			type: GitHubEventType.DISCUSSION_COMMENT_CREATED,
			event: "discussion_comment",
			payload,
		};
	}

	if (isDiscussionClosedPayload(event, payload)) {
		return {
			type: GitHubEventType.DISCUSSION_CLOSED,
			event: "discussion",
			payload,
		};
	}

	return null;
}
