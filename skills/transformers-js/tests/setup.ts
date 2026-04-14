import os from "node:os";
import path from "node:path";
import { env } from "@huggingface/transformers";

env.cacheDir = path.join(os.homedir(), ".cache", "transformers-js");
