import type { TeamRole } from "@/drizzle";
import type { TeamId } from "@/services/teams/types";
import type { Invitation } from "./invitation";
import { InvitationListItem } from "./invitation-list-item";
import { TeamMemberListItem } from "./team-members-list-item";

type TeamMembersListProps = {
	teamId: TeamId;
	members: {
		userId: string;
		displayName: string | null;
		email: string | null;
		role: TeamRole;
	}[];
	invitations: Invitation[];
	currentUserRole: TeamRole;
	isProPlan: boolean;
};

export async function TeamMembersList({
	teamId,
	members,
	invitations,
	currentUserRole,
	isProPlan,
}: TeamMembersListProps) {
	return (
		<>
			{members.map((member) => (
				<TeamMemberListItem
					key={`${teamId}-${member.userId}`}
					userId={member.userId}
					displayName={member.displayName}
					email={member.email}
					role={member.role}
					currentUserRole={currentUserRole}
					isProPlan={isProPlan}
				/>
			))}

			{invitations.length > 0 &&
				invitations.map((invitation) => (
					<InvitationListItem
						key={invitation.token}
						token={invitation.token}
						email={invitation.email}
						role={invitation.role}
						expiredAt={invitation.expiredAt}
					/>
				))}
		</>
	);
}
