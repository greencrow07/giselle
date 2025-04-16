import type { TeamRole } from "@/drizzle";
import type { TeamId } from "@/services/teams/types";
import { TeamMemberListItem } from "./team-members-list-item";

type TeamMembersListProps = {
	teamId: TeamId;
	members: {
		userId: string;
		displayName: string | null;
		email: string | null;
		role: TeamRole;
		isInvited?: boolean;
	}[];
	invitations: {
		email: string;
		role: TeamRole;
		expiredAt: Date;
	}[];
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
					isInvited={member.isInvited}
				/>
			))}

			{invitations.length > 0 &&
				invitations.map((invitation, index) => (
					<TeamMemberListItem
						key={`invited-${index}-${invitation.email}`}
						userId={`temp-id-${index}`}
						displayName={null}
						email={invitation.email}
						role={invitation.role}
						currentUserRole={currentUserRole}
						isProPlan={isProPlan}
						isInvited={true}
					/>
				))}
		</>
	);
}
