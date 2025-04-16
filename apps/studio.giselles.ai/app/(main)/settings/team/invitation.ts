import type { TeamRole, UserId } from "@/drizzle";
import { type CurrentTeam, fetchCurrentTeam } from "@/services/teams";

export type Invitation = {
	token: string;
	teamDbId: number;
	email: string;
	role: TeamRole;
	inviteUserDbId: number;
	expiredAt: Date;
};

export async function createInvitation(
	email: string,
	role: TeamRole,
	currentTeam: CurrentTeam,
	currentUser: {
		dbId: number;
		id: UserId;
	},
): Promise<Invitation> {
	const token = crypto.randomUUID();
	const expiredAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

	return {
		token,
		teamDbId: currentTeam.dbId,
		email,
		role,
		inviteUserDbId: currentUser.dbId,
		expiredAt,
	};
}

export async function sendInvitationEmail(invitation: Invitation) {
	// TODO: send email
	console.log(
		`Invitation has been sent to ${invitation.email}, role is ${invitation.role}`,
	);
}

export async function listInvitations(): Promise<Invitation[]> {
	const currentTeam = await fetchCurrentTeam();

	// TODO: get from db
	return [
		{
			token: "123",
			teamDbId: currentTeam.dbId,
			email: "invited@example.com",
			role: "admin",
			inviteUserDbId: 123,
			expiredAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
		},
		{
			token: "456",
			teamDbId: currentTeam.dbId,
			email: "expired@example.com",
			role: "member",
			inviteUserDbId: 456,
			expiredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
		},
	];
}
