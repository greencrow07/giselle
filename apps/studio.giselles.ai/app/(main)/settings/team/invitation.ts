import type { TeamRole, UserId } from "@/drizzle";
import { db } from "@/drizzle";
import { invitations, teams, users } from "@/drizzle/schema";
import { sendEmail } from "@/services/external/email";
import { type CurrentTeam, fetchCurrentTeam } from "@/services/teams";
import { and, eq, isNull } from "drizzle-orm";

export async function createInvitation(
	email: string,
	role: TeamRole,
	currentTeam: CurrentTeam,
	currentUser: {
		dbId: number;
		id: UserId;
	},
) {
	const token = crypto.randomUUID();
	const expiredAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

	const result = await db
		.insert(invitations)
		.values({
			token,
			teamDbId: currentTeam.dbId,
			email,
			role,
			inviteUserDbId: currentUser.dbId,
			expiredAt,
			revokedAt: null,
		})
		.returning({
			token: invitations.token,
			teamDbId: invitations.teamDbId,
			email: invitations.email,
			role: invitations.role,
			inviteUserDbId: invitations.inviteUserDbId,
			expiredAt: invitations.expiredAt,
			createdAt: invitations.createdAt,
			revokedAt: invitations.revokedAt,
		});

	return result[0];
}

export async function sendInvitationEmail(
	invitation: typeof invitations.$inferSelect,
) {
	const inviter = await db
		.select({
			displayName: users.displayName,
		})
		.from(users)
		.where(eq(users.dbId, invitation.inviteUserDbId))
		.limit(1);
	if (inviter.length === 0) {
		throw new Error("Inviter not found");
	}
	const inviterDisplayName = inviter[0].displayName;

	const team = await db
		.select({
			name: teams.name,
		})
		.from(teams)
		.where(eq(teams.dbId, invitation.teamDbId))
		.limit(1);
	if (team.length === 0) {
		throw new Error("Team not found");
	}
	const teamName = team[0].name;

	await sendEmail(
		"Invitation to join team",
		`You have been invited to join the team ${teamName} by ${inviterDisplayName}.`,
		[
			{
				userDisplayName: "",
				userEmail: invitation.email,
			},
		],
	);
}

export async function listInvitations() {
	const currentTeam = await fetchCurrentTeam();
	const result = await db
		.select()
		.from(invitations)
		.where(
			and(
				eq(invitations.teamDbId, currentTeam.dbId),
				isNull(invitations.revokedAt),
			),
		);
	return result;
}

export async function revokeInvitation(token: string) {
	await db
		.update(invitations)
		.set({ revokedAt: new Date() })
		.where(eq(invitations.token, token));
}
