"use client";

import type { TeamRole } from "@/drizzle";
import Avatar from "boring-avatars";
import { Copy, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { resendInvitationAction, revokeInvitationAction } from "./actions";
import { LocalDateTime } from "./components/local-date-time";

export type InvitationListItemProps = {
	token: string;
	email: string;
	role: TeamRole;
	expiredAt: Date;
};

export function InvitationListItem({
	token,
	email,
	role,
	expiredAt,
}: InvitationListItemProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [copied, setCopied] = useState(false);

	const expired = expiredAt.getTime() < Date.now();

	const handleRevoke = async () => {
		try {
			setIsLoading(true);
			const formData = new FormData();
			formData.append("token", token);
			const result = await revokeInvitationAction(formData);
			if (!result?.success) {
				setError("Failed to revoke invitation");
			}
		} catch (e) {
			if (e instanceof Error) {
				setError(e.message);
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleResend = async () => {
		try {
			setIsLoading(true);
			const formData = new FormData();
			formData.append("token", token);
			const result = await resendInvitationAction(formData);
			if (!result?.success) {
				setError("Failed to resend invitation");
			}
		} catch (e) {
			if (e instanceof Error) {
				setError(e.message);
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleCopy = async () => {
		try {
			const baseUrl =
				process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
			const link = `${baseUrl}/join/${token}`;
			await navigator.clipboard.writeText(link);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (e) {
			console.error("Failed to copy link:", e);
		}
	};

	return (
		<div className="px-2">
			<div className="flex items-center justify-between gap-4 py-4 border-b-[0.5px] border-black-400 font-hubot">
				<div className="flex gap-x-4 items-center">
					<div className="flex-shrink-0 opacity-50">
						<Avatar
							name={email}
							variant="marble"
							size={32}
							colors={["#413e4a", "#73626e", "#b38184", "#f0b49e", "#f7e4be"]}
						/>
					</div>
					<div className="flex flex-col gap-y-1 font-medium text-[12px] leading-[12px] opacity-50">
						<div className="text-blue-80">{email}</div>
						<div className="text-white-400">Invited as {role}</div>
						{expired && (
							<div className="text-error-900 text-[12px]">
								Expired on <LocalDateTime date={expiredAt} />
							</div>
						)}
					</div>
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={handleCopy}
						disabled={isLoading}
						className="text-white-400 hover:text-white-900"
						title="Copy invite link"
					>
						{copied ? "Copied!" : <Copy className="h-4 w-4" />}
					</button>
					<button
						type="button"
						onClick={handleResend}
						disabled={isLoading}
						className="text-white-400 hover:text-white-900"
						title="Resend invitation"
					>
						<RefreshCw className="h-4 w-4" />
					</button>
					<button
						type="button"
						onClick={handleRevoke}
						disabled={isLoading}
						className="text-error-900 hover:text-error-700"
						title="Revoke invitation"
					>
						<Trash2 className="h-4 w-4" />
					</button>
				</div>
			</div>
			{error && (
				<div className="text-error-900 text-[12px] mt-1 ml-12">{error}</div>
			)}
		</div>
	);
}
