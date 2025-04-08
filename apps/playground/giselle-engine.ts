import { WorkspaceId } from "@giselle-sdk/data-type";
import type {
	GiselleIntegrationConfig,
	LanguageModelProvider,
} from "giselle-sdk";
import { NextGiselleEngine } from "giselle-sdk/next";

import { createStorage } from "unstorage";
import fsDriver from "unstorage/drivers/fs";
import s3Driver from "unstorage/drivers/s3";

const isVercelEnvironment = true;

const storage = createStorage({
	driver: isVercelEnvironment
		? s3Driver({
				accessKeyId: process.env.SUPABASE_ACCESS_KEY_ID ?? "",
				secretAccessKey: process.env.SUPABASE_SECRET_ACCESS_KEY ?? "",
				endpoint: "https://tgcufejmblzzwntopjiy.supabase.co/storage/v1/s3",
				region: "us-west-1",
				bucket: "experiment",
			})
		: fsDriver({
				base: "./.storage",
			}),
});

const llmProviders: LanguageModelProvider[] = [];
if (process.env.OPENAI_API_KEY) {
	llmProviders.push("openai");
}
if (process.env.ANTHROPIC_API_KEY) {
	llmProviders.push("anthropic");
}
if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
	llmProviders.push("google");
}

if (llmProviders.length === 0) {
	throw new Error("No LLM providers configured");
}

const integrationConfigs: GiselleIntegrationConfig[] = [];
if (
	process.env.GITHUB_APP_ID &&
	process.env.GITHUB_APP_PRIVATE_KEY &&
	process.env.GITHUB_APP_CLIENT_ID &&
	process.env.GITHUB_APP_CLIENT_SECRET
) {
	integrationConfigs.push({
		provider: "github",
		auth: {
			strategy: "github-installation",
			appId: process.env.GITHUB_APP_ID,
			privateKey: process.env.GITHUB_APP_PRIVATE_KEY,
		},
	});
}
if (process.env.GITHUB_TOKEN) {
	integrationConfigs.push({
		provider: "github",
		auth: {
			strategy: "github-token",
			token: process.env.GITHUB_TOKEN,
		},
	});
}

if (process.env.PERPLEXITY_API_KEY) {
	llmProviders.push("perplexity");
}

if (process.env.FAL_API_KEY) {
	llmProviders.push("fal");
}

let sampleAppWorkspaceId: WorkspaceId | undefined = undefined;
if (process.env.SAMPLE_APP_WORKSPACE_ID) {
	const parseResult = WorkspaceId.safeParse(
		process.env.SAMPLE_APP_WORKSPACE_ID,
	);
	if (parseResult.success) {
		sampleAppWorkspaceId = parseResult.data;
	}
}

export const giselleEngine = NextGiselleEngine({
	basePath: "/api/giselle",
	storage,
	llmProviders,
	integrationConfigs,
	sampleAppWorkspaceId,
});
