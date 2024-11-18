"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const TeamCreationModal = () => {
	const [teamName, setTeamName] = useState("");
	const [selectedPlan, setSelectedPlan] = useState("");
	const hasExistingFreeTeam = true;

	const handleSubmit = (e) => {
		e.preventDefault();
		if (selectedPlan === "pro") {
			alert("Redirecting to Stripe...");
		}
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Link
					href="#"
					className="flex items-center text-sm text-blue-500 hover:text-blue-400"
				>
					+ Create New Team
				</Link>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[500px] bg-gray-950 text-gray-100">
				<DialogHeader>
					<DialogTitle className="text-2xl font-bold text-gray-100">
						Create New Team
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="space-y-2">
						<Label htmlFor="teamName" className="text-gray-200">
							Team Name
						</Label>
						<Input
							id="teamName"
							value={teamName}
							onChange={(e) => setTeamName(e.target.value)}
							className="bg-gray-900 border-gray-800 text-gray-100"
							placeholder="Enter team name"
						/>
					</div>
					<div className="space-y-4">
						<Label className="text-gray-200">Select Plan</Label>
						<RadioGroup
							value={selectedPlan}
							onValueChange={setSelectedPlan}
							className="grid grid-cols-2 gap-4"
						>
							<Card
								className={`bg-gray-900 border-gray-800 ${hasExistingFreeTeam ? "opacity-50" : ""}`}
							>
								<CardHeader>
									<CardTitle className="text-gray-100">Free</CardTitle>
									<CardDescription className="text-gray-400">
										Basic features for small teams
									</CardDescription>
								</CardHeader>
								<CardContent>
									<RadioGroupItem
										value="free"
										id="free"
										disabled={hasExistingFreeTeam}
										className="text-blue-500"
									/>
									<Label htmlFor="free" className="ml-2 text-gray-300">
										$0/month
									</Label>
								</CardContent>
							</Card>
							<Card className="bg-gray-900 border-gray-800">
								<CardHeader>
									<CardTitle className="text-gray-100">Pro</CardTitle>
									<CardDescription className="text-gray-400">
										Advanced features & support
									</CardDescription>
								</CardHeader>
								<CardContent>
									<RadioGroupItem
										value="pro"
										id="pro"
										className="text-blue-500"
									/>
									<Label htmlFor="pro" className="ml-2 text-gray-300">
										$29/month
									</Label>
								</CardContent>
							</Card>
						</RadioGroup>
						{hasExistingFreeTeam && (
							<Alert
								variant="destructive"
								className="bg-red-900/20 border-red-900 text-red-400"
							>
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>
									You already have a Free plan team. Please upgrade to Pro for
									additional teams.
								</AlertDescription>
							</Alert>
						)}
					</div>
					<Button
						type="submit"
						className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
						disabled={!teamName || !selectedPlan}
					>
						{selectedPlan === "pro" ? "Proceed to Payment" : "Create Team"}
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
};

export default TeamCreationModal;
