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
// FIXME: Consider replace @octokit/webhooks-type with @octokit/openapi-webhooks-types or @octokit/webhooks
// DiscussionClosedEvent is not defined in @octokit/webhooks-types
import type { DiscussionClosedEvent } from "./discussion-types";

export enum GitHubEventType {
	ISSUE_COMMENT_CREATED = "issue_comment.created",
	ISSUES_OPENED = "issues.opened",
	ISSUES_CLOSED = "issues.closed",
	PULL_REQUEST_OPENED = "pull_request.opened",
	PULL_REQUEST_READY_FOR_REVIEW = "pull_request.ready_for_review",
	PULL_REQUEST_CLOSED = "pull_request.closed",
	DISCUSSION_CREATED = "discussion.created",
	DISCUSSION_COMMENT_CREATED = "discussion_comment.created",
	DISCUSSION_CLOSED = "discussion.closed",
}

export type GitHubEvent =
	| {
			type: GitHubEventType.ISSUE_COMMENT_CREATED;
			event: "issue_comment";
			payload: IssueCommentCreatedEvent;
	  }
	| {
			type: GitHubEventType.ISSUES_OPENED;
			event: "issues";
			payload: IssuesOpenedEvent;
	  }
	| {
			type: GitHubEventType.ISSUES_CLOSED;
			event: "issues";
			payload: IssuesClosedEvent;
	  }
	| {
			type: GitHubEventType.PULL_REQUEST_OPENED;
			event: "pull_request";
			payload: PullRequestOpenedEvent;
	  }
	| {
			type: GitHubEventType.PULL_REQUEST_READY_FOR_REVIEW;
			event: "pull_request";
			payload: PullRequestReadyForReviewEvent;
	  }
	| {
			type: GitHubEventType.PULL_REQUEST_CLOSED;
			event: "pull_request";
			payload: PullRequestClosedEvent;
	  }
	| {
			type: GitHubEventType.DISCUSSION_CREATED;
			event: "discussion";
			payload: DiscussionCreatedEvent;
	  }
	| {
			type: GitHubEventType.DISCUSSION_COMMENT_CREATED;
			event: "discussion_comment";
			payload: DiscussionCommentCreatedEvent;
	  }
	| {
			type: GitHubEventType.DISCUSSION_CLOSED;
			event: "discussion";
			payload: DiscussionClosedEvent;
	  };
