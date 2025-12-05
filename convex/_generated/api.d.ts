/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions from "../actions.js";
import type * as characters from "../characters.js";
import type * as conversations from "../conversations.js";
import type * as images from "../images.js";
import type * as interactions from "../interactions.js";
import type * as messages from "../messages.js";
import type * as orders from "../orders.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";
import type * as utils_image_gen from "../utils/image_gen.js";
import type * as utils_llm from "../utils/llm.js";
import type * as utils_r2 from "../utils/r2.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  actions: typeof actions;
  characters: typeof characters;
  conversations: typeof conversations;
  images: typeof images;
  interactions: typeof interactions;
  messages: typeof messages;
  orders: typeof orders;
  seed: typeof seed;
  users: typeof users;
  "utils/image_gen": typeof utils_image_gen;
  "utils/llm": typeof utils_llm;
  "utils/r2": typeof utils_r2;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
