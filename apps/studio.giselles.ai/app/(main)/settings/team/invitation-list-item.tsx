"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TeamRole } from "@/drizzle";
import { useToast } from "@/packages/contexts/toast";
import { Copy, Ellipsis, RefreshCw, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";
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
	const { addToast, toasts } = useToast();
	const [open, setOpen] = useState(false);

	const expired = expiredAt.getTime() < Date.now();

	const handleRevoke = async () => {
		try {
			setIsLoading(true);
			const formData = new FormData();
			formData.append("token", token);
			const result = await revokeInvitationAction(formData);
			if (!result?.success) {
				setError("Failed to revoke invitation");
			} else {
				addToast({
					title: "Success",
					message: "Invitation revoked!",
					type: "success",
				});
			}
		} catch (e) {
			if (e instanceof Error) {
				setError(e.message);
			}
		} finally {
			setIsLoading(false);
		}
	};

	type ResendResult = { success: boolean; error?: string };

	const resendAction = async (
		_state: { success: boolean },
		formData: FormData,
	): Promise<ResendResult> => {
		const result = (await resendInvitationAction(formData)) as ResendResult;
		if (result?.success) {
			addToast({
				title: "Success",
				message: "Invitation resent!",
				type: "success",
			});
		} else {
			addToast({
				title: "Error",
				message:
					result && typeof result.error === "string"
						? result.error
						: "Failed to resend invitation",
				type: "error",
			});
		}
		return result;
	};

	const [_, resend, resendPending] = useActionState(resendAction, {
		success: false,
	});

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
						<div className="w-8 h-8 rounded-full border border-dashed border-white-400 flex items-center justify-center">
							{/* Empty circle with dashed border */}
						</div>
					</div>
					<div className="flex flex-col gap-y-1 font-medium text-[12px] leading-[12px]">
						<div className="text-blue-80 flex items-center">
							{email}
							<span className="ml-2 text-black-400">(Invitation pending)</span>
						</div>
						{expired && (
							<div className="text-error-900 text-[12px]">
								Expired on <LocalDateTime date={expiredAt} />
							</div>
						)}
					</div>
				</div>
				<div className="flex items-center gap-2">
					<span className="capitalize text-white-400 font-medium text-[14px] leading-[16px] text-end font-hubot">
						{role}
					</span>
					<DropdownMenu modal={false}>
						<DropdownMenuTrigger className="cursor-pointer">
							<Ellipsis className="text-white-350" />
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							className="px-0 py-2 border-[0.5px] border-error-900 rounded-[8px] min-w-[165px] bg-black-850 shadow-none"
						>
							<button
								type="button"
								onClick={handleCopy}
								disabled={isLoading}
								className="flex items-center w-full px-4 py-3 font-medium text-[14px] leading-[16px] text-white-400 hover:bg-black-700"
								title="Copy invite link"
							>
								<Copy className="h-4 w-4 mr-2" /> Copy invite link
							</button>
							<form action={resend} className="contents">
								<input type="hidden" name="token" value={token} />
								<button
									type="submit"
									disabled={resendPending}
									className="flex items-center w-full px-4 py-3 font-medium text-[14px] leading-[16px] text-white-400 hover:bg-black-700"
									title="Resend invitation"
								>
									{resendPending ? (
										<RefreshCw className="h-4 w-4 animate-spin mr-2" />
									) : (
										<RefreshCw className="h-4 w-4 mr-2" />
									)}{" "}
									Resend invitation
								</button>
							</form>
							<AlertDialog open={open} onOpenChange={setOpen}>
								<AlertDialogTrigger asChild>
									<button
										type="button"
										disabled={isLoading}
										className="flex items-center w-full px-4 py-3 font-medium text-[14px] leading-[16px] text-error-900 hover:bg-black-700"
										title="Revoke invitation"
									>
										<Trash2 className="h-4 w-4 mr-2" /> Revoke invitation
									</button>
								</AlertDialogTrigger>
								<AlertDialogContent className="border-[0.5px] border-black-400 rounded-[8px] bg-black-850">
									<AlertDialogHeader>
										<AlertDialogTitle className="text-white-400 text-[20px] leading-[29px] font-geist">
											Revoke Invitation
										</AlertDialogTitle>
										<AlertDialogDescription className="text-black-400 text-[14px] leading-[20.4px]">
											This will permanently revoke this invitation and prevent
											the user from joining your team.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter className="mt-4">
										<AlertDialogCancel
											className="py-2 px-4 border-[0.5px] border-black-400 rounded-[8px] font-hubot"
											disabled={isLoading}
										>
											Cancel
										</AlertDialogCancel>
										<AlertDialogAction
											onClick={handleRevoke}
											disabled={isLoading}
											className="py-2 px-4 bg-error-900 rounded-[8px] text-white-400 font-hubot"
										>
											Revoke
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
			{error && (
				<div className="text-error-900 text-[12px] mt-1 ml-12">{error}</div>
			)}
		</div>
	);
}
