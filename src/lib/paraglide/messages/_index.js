/* eslint-disable */
import { getLocale, trackMessageCall, experimentalMiddlewareLocaleSplitting, isServer, experimentalStaticLocale } from "../runtime.js"
/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */
import * as __en from "./en.js"
import * as __pt from "./pt.js"
import * as __es from "./es.js"
/**
* This function has been compiled by [Paraglide JS](https://inlang.com/m/gerre34r).
*
* - Changing this function will be over-written by the next build.
*
* - If you want to change the translations, you can either edit the source files e.g. `en.json`, or
* use another inlang app like [Fink](https://inlang.com/m/tdozzpar) or the [VSCode extension Sherlock](https://inlang.com/m/r7kp499g).
*
* @param {{}} inputs
* @param {{ locale?: "en" | "pt" | "es" }} options
* @returns {LocalizedString}
*/
/* @__NO_SIDE_EFFECTS__ */
export const hello_world = (inputs = {}, options = {}) => {
	if (experimentalMiddlewareLocaleSplitting && isServer === false) {
		return /** @type {any} */ (globalThis).__paraglide_ssr.hello_world(inputs)
	}
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	trackMessageCall("hello_world", locale)
	if (locale === "en") return __en.hello_world(inputs)
	if (locale === "pt") return __pt.hello_world(inputs)
	return __es.hello_world(inputs)
};