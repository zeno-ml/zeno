function noop() { }
function assign(tar, src) {
    // @ts-ignore
    for (const k in src)
        tar[k] = src[k];
    return tar;
}
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}
function is_empty(obj) {
    return Object.keys(obj).length === 0;
}
function create_slot(definition, ctx, $$scope, fn) {
    if (definition) {
        const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
        return definition[0](slot_ctx);
    }
}
function get_slot_context(definition, ctx, $$scope, fn) {
    return definition[1] && fn
        ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
        : $$scope.ctx;
}
function get_slot_changes(definition, $$scope, dirty, fn) {
    if (definition[2] && fn) {
        const lets = definition[2](fn(dirty));
        if ($$scope.dirty === undefined) {
            return lets;
        }
        if (typeof lets === 'object') {
            const merged = [];
            const len = Math.max($$scope.dirty.length, lets.length);
            for (let i = 0; i < len; i += 1) {
                merged[i] = $$scope.dirty[i] | lets[i];
            }
            return merged;
        }
        return $$scope.dirty | lets;
    }
    return $$scope.dirty;
}
function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
    if (slot_changes) {
        const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
        slot.p(slot_context, slot_changes);
    }
}
function get_all_dirty_from_scope($$scope) {
    if ($$scope.ctx.length > 32) {
        const dirty = [];
        const length = $$scope.ctx.length / 32;
        for (let i = 0; i < length; i++) {
            dirty[i] = -1;
        }
        return dirty;
    }
    return -1;
}
function exclude_internal_props(props) {
    const result = {};
    for (const k in props)
        if (k[0] !== '$')
            result[k] = props[k];
    return result;
}
function compute_rest_props(props, keys) {
    const rest = {};
    keys = new Set(keys);
    for (const k in props)
        if (!keys.has(k) && k[0] !== '$')
            rest[k] = props[k];
    return rest;
}
function action_destroyer(action_result) {
    return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
}
function append(target, node) {
    target.appendChild(node);
}
function append_styles(target, style_sheet_id, styles) {
    const append_styles_to = get_root_for_style(target);
    if (!append_styles_to.getElementById(style_sheet_id)) {
        const style = element('style');
        style.id = style_sheet_id;
        style.textContent = styles;
        append_stylesheet(append_styles_to, style);
    }
}
function get_root_for_style(node) {
    if (!node)
        return document;
    const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
    if (root && root.host) {
        return root;
    }
    return node.ownerDocument;
}
function append_stylesheet(node, style) {
    append(node.head || node, style);
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    node.parentNode.removeChild(node);
}
function destroy_each(iterations, detaching) {
    for (let i = 0; i < iterations.length; i += 1) {
        if (iterations[i])
            iterations[i].d(detaching);
    }
}
function element(name) {
    return document.createElement(name);
}
function svg_element(name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
}
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function empty() {
    return text('');
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function prevent_default(fn) {
    return function (event) {
        event.preventDefault();
        // @ts-ignore
        return fn.call(this, event);
    };
}
function stop_propagation(fn) {
    return function (event) {
        event.stopPropagation();
        // @ts-ignore
        return fn.call(this, event);
    };
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);
}
function set_attributes(node, attributes) {
    // @ts-ignore
    const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
    for (const key in attributes) {
        if (attributes[key] == null) {
            node.removeAttribute(key);
        }
        else if (key === 'style') {
            node.style.cssText = attributes[key];
        }
        else if (key === '__value') {
            node.value = node[key] = attributes[key];
        }
        else if (descriptors[key] && descriptors[key].set) {
            node[key] = attributes[key];
        }
        else {
            attr(node, key, attributes[key]);
        }
    }
}
function set_svg_attributes(node, attributes) {
    for (const key in attributes) {
        attr(node, key, attributes[key]);
    }
}
function children(element) {
    return Array.from(element.childNodes);
}
function set_data(text, data) {
    data = '' + data;
    if (text.wholeText !== data)
        text.data = data;
}
function set_style(node, key, value, important) {
    if (value === null) {
        node.style.removeProperty(key);
    }
    else {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
}

let current_component;
function set_current_component(component) {
    current_component = component;
}
function get_current_component() {
    if (!current_component)
        throw new Error('Function called outside component initialization');
    return current_component;
}
function onDestroy(fn) {
    get_current_component().$$.on_destroy.push(fn);
}
function setContext(key, context) {
    get_current_component().$$.context.set(key, context);
    return context;
}
function getContext(key) {
    return get_current_component().$$.context.get(key);
}
// TODO figure out if we still want to support
// shorthand events, or if we want to implement
// a real bubbling mechanism
function bubble(component, event) {
    const callbacks = component.$$.callbacks[event.type];
    if (callbacks) {
        // @ts-ignore
        callbacks.slice().forEach(fn => fn.call(this, event));
    }
}

const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
// flush() calls callbacks in this order:
// 1. All beforeUpdate callbacks, in order: parents before children
// 2. All bind:this callbacks, in reverse order: children before parents.
// 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
//    for afterUpdates called during the initial onMount, which are called in
//    reverse order: children before parents.
// Since callbacks might update component values, which could trigger another
// call to flush(), the following steps guard against this:
// 1. During beforeUpdate, any updated components will be added to the
//    dirty_components array and will cause a reentrant call to flush(). Because
//    the flush index is kept outside the function, the reentrant call will pick
//    up where the earlier call left off and go through all dirty components. The
//    current_component value is saved and restored so that the reentrant call will
//    not interfere with the "parent" flush() call.
// 2. bind:this callbacks cannot trigger new flush() calls.
// 3. During afterUpdate, any updated components will NOT have their afterUpdate
//    callback called a second time; the seen_callbacks set, outside the flush()
//    function, guarantees this behavior.
const seen_callbacks = new Set();
let flushidx = 0; // Do *not* move this inside the flush() function
function flush() {
    const saved_component = current_component;
    do {
        // first, call beforeUpdate functions
        // and update components
        while (flushidx < dirty_components.length) {
            const component = dirty_components[flushidx];
            flushidx++;
            set_current_component(component);
            update(component.$$);
        }
        set_current_component(null);
        dirty_components.length = 0;
        flushidx = 0;
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
                callback();
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
    seen_callbacks.clear();
    set_current_component(saved_component);
}
function update($$) {
    if ($$.fragment !== null) {
        $$.update();
        run_all($$.before_update);
        const dirty = $$.dirty;
        $$.dirty = [-1];
        $$.fragment && $$.fragment.p($$.ctx, dirty);
        $$.after_update.forEach(add_render_callback);
    }
}
const outroing = new Set();
let outros;
function group_outros() {
    outros = {
        r: 0,
        c: [],
        p: outros // parent group
    };
}
function check_outros() {
    if (!outros.r) {
        run_all(outros.c);
    }
    outros = outros.p;
}
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function transition_out(block, local, detach, callback) {
    if (block && block.o) {
        if (outroing.has(block))
            return;
        outroing.add(block);
        outros.c.push(() => {
            outroing.delete(block);
            if (callback) {
                if (detach)
                    block.d(1);
                callback();
            }
        });
        block.o(local);
    }
    else if (callback) {
        callback();
    }
}

function get_spread_update(levels, updates) {
    const update = {};
    const to_null_out = {};
    const accounted_for = { $$scope: 1 };
    let i = levels.length;
    while (i--) {
        const o = levels[i];
        const n = updates[i];
        if (n) {
            for (const key in o) {
                if (!(key in n))
                    to_null_out[key] = 1;
            }
            for (const key in n) {
                if (!accounted_for[key]) {
                    update[key] = n[key];
                    accounted_for[key] = 1;
                }
            }
            levels[i] = n;
        }
        else {
            for (const key in o) {
                accounted_for[key] = 1;
            }
        }
    }
    for (const key in to_null_out) {
        if (!(key in update))
            update[key] = undefined;
    }
    return update;
}
function get_spread_object(spread_props) {
    return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
}
function create_component(block) {
    block && block.c();
}
function mount_component(component, target, anchor, customElement) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment && fragment.m(target, anchor);
    if (!customElement) {
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
    }
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    const $$ = component.$$;
    if ($$.fragment !== null) {
        run_all($$.on_destroy);
        $$.fragment && $$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        $$.on_destroy = $$.fragment = null;
        $$.ctx = [];
    }
}
function make_dirty(component, i) {
    if (component.$$.dirty[0] === -1) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty.fill(0);
    }
    component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
}
function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
    const parent_component = current_component;
    set_current_component(component);
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        on_disconnect: [],
        before_update: [],
        after_update: [],
        context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
        // everything else
        callbacks: blank_object(),
        dirty,
        skip_bound: false,
        root: options.target || parent_component.$$.root
    };
    append_styles && append_styles($$.root);
    let ready = false;
    $$.ctx = instance
        ? instance(component, options.props || {}, (i, ret, ...rest) => {
            const value = rest.length ? rest[0] : ret;
            if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                if (!$$.skip_bound && $$.bound[i])
                    $$.bound[i](value);
                if (ready)
                    make_dirty(component, i);
            }
            return ret;
        })
        : [];
    $$.update();
    ready = true;
    run_all($$.before_update);
    // `false` as a special case of no DOM component
    $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
    if (options.target) {
        if (options.hydrate) {
            const nodes = children(options.target);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.l(nodes);
            nodes.forEach(detach);
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor, options.customElement);
        flush();
    }
    set_current_component(parent_component);
}
/**
 * Base class for Svelte components. Used when dev=false.
 */
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
    }
    $on(type, callback) {
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set($$props) {
        if (this.$$set && !is_empty($$props)) {
            this.$$.skip_bound = true;
            this.$$set($$props);
            this.$$.skip_bound = false;
        }
    }
}

// Material Design Icons v6.9.96
var mdiPause = "M14,19H18V5H14M6,19H10V5H6V19Z";
var mdiPlay = "M8,5.14V19.14L19,12.14L8,5.14Z";

function classMap(classObj) {
    return Object.entries(classObj)
        .filter(([name, value]) => name !== '' && value)
        .map(([name]) => name)
        .join(' ');
}

function dispatch(element, eventType, detail, eventInit = { bubbles: true }, 
/** This is an internal thing used by SMUI to duplicate some SMUI events as MDC events. */
duplicateEventForMDC = false) {
    if (typeof Event !== 'undefined' && element) {
        const event = new CustomEvent(eventType, Object.assign(Object.assign({}, eventInit), { detail }));
        element === null || element === void 0 ? void 0 : element.dispatchEvent(event);
        if (duplicateEventForMDC && eventType.startsWith('SMUI')) {
            const duplicateEvent = new CustomEvent(eventType.replace(/^SMUI/g, () => 'MDC'), Object.assign(Object.assign({}, eventInit), { detail }));
            element === null || element === void 0 ? void 0 : element.dispatchEvent(duplicateEvent);
            if (duplicateEvent.defaultPrevented) {
                event.preventDefault();
            }
        }
        return event;
    }
}

// Match old modifiers. (only works on DOM events)
const oldModifierRegex = /^[a-z]+(?::(?:preventDefault|stopPropagation|passive|nonpassive|capture|once|self))+$/;
// Match new modifiers.
const newModifierRegex = /^[^$]+(?:\$(?:preventDefault|stopPropagation|passive|nonpassive|capture|once|self))+$/;
function forwardEventsBuilder(component) {
    // This is our pseudo $on function. It is defined on component mount.
    let $on;
    // This is a list of events bound before mount.
    let events = [];
    // And we override the $on function to forward all bound events.
    component.$on = (fullEventType, callback) => {
        let eventType = fullEventType;
        let destructor = () => { };
        if ($on) {
            // The event was bound programmatically.
            destructor = $on(eventType, callback);
        }
        else {
            // The event was bound before mount by Svelte.
            events.push([eventType, callback]);
        }
        const oldModifierMatch = eventType.match(oldModifierRegex);
        if (oldModifierMatch && console) {
            console.warn('Event modifiers in SMUI now use "$" instead of ":", so that ' +
                'all events can be bound with modifiers. Please update your ' +
                'event binding: ', eventType);
        }
        return () => {
            destructor();
        };
    };
    function forward(e) {
        // Internally bubble the event up from Svelte components.
        bubble(component, e);
    }
    return (node) => {
        const destructors = [];
        const forwardDestructors = {};
        // This function is responsible for listening and forwarding
        // all bound events.
        $on = (fullEventType, callback) => {
            let eventType = fullEventType;
            let handler = callback;
            // DOM addEventListener options argument.
            let options = false;
            const oldModifierMatch = eventType.match(oldModifierRegex);
            const newModifierMatch = eventType.match(newModifierRegex);
            const modifierMatch = oldModifierMatch || newModifierMatch;
            if (eventType.match(/^SMUI:\w+:/)) {
                const newEventTypeParts = eventType.split(':');
                let newEventType = '';
                for (let i = 0; i < newEventTypeParts.length; i++) {
                    newEventType +=
                        i === newEventTypeParts.length - 1
                            ? ':' + newEventTypeParts[i]
                            : newEventTypeParts[i]
                                .split('-')
                                .map((value) => value.slice(0, 1).toUpperCase() + value.slice(1))
                                .join('');
                }
                console.warn(`The event ${eventType.split('$')[0]} has been renamed to ${newEventType.split('$')[0]}.`);
                eventType = newEventType;
            }
            if (modifierMatch) {
                // Parse the event modifiers.
                // Supported modifiers:
                // - preventDefault
                // - stopPropagation
                // - passive
                // - nonpassive
                // - capture
                // - once
                const parts = eventType.split(oldModifierMatch ? ':' : '$');
                eventType = parts[0];
                const eventOptions = Object.fromEntries(parts.slice(1).map((mod) => [mod, true]));
                if (eventOptions.passive) {
                    options = options || {};
                    options.passive = true;
                }
                if (eventOptions.nonpassive) {
                    options = options || {};
                    options.passive = false;
                }
                if (eventOptions.capture) {
                    options = options || {};
                    options.capture = true;
                }
                if (eventOptions.once) {
                    options = options || {};
                    options.once = true;
                }
                if (eventOptions.preventDefault) {
                    handler = prevent_default(handler);
                }
                if (eventOptions.stopPropagation) {
                    handler = stop_propagation(handler);
                }
            }
            // Listen for the event directly, with the given options.
            const off = listen(node, eventType, handler, options);
            const destructor = () => {
                off();
                const idx = destructors.indexOf(destructor);
                if (idx > -1) {
                    destructors.splice(idx, 1);
                }
            };
            destructors.push(destructor);
            // Forward the event from Svelte.
            if (!(eventType in forwardDestructors)) {
                forwardDestructors[eventType] = listen(node, eventType, forward);
            }
            return destructor;
        };
        for (let i = 0; i < events.length; i++) {
            // Listen to all the events added before mount.
            $on(events[i][0], events[i][1]);
        }
        return {
            destroy: () => {
                // Remove all event listeners.
                for (let i = 0; i < destructors.length; i++) {
                    destructors[i]();
                }
                // Remove all event forwarders.
                for (let entry of Object.entries(forwardDestructors)) {
                    entry[1]();
                }
            },
        };
    };
}

function useActions(node, actions) {
    let actionReturns = [];
    if (actions) {
        for (let i = 0; i < actions.length; i++) {
            const actionEntry = actions[i];
            const action = Array.isArray(actionEntry) ? actionEntry[0] : actionEntry;
            if (Array.isArray(actionEntry) && actionEntry.length > 1) {
                actionReturns.push(action(node, actionEntry[1]));
            }
            else {
                actionReturns.push(action(node));
            }
        }
    }
    return {
        update(actions) {
            if (((actions && actions.length) || 0) != actionReturns.length) {
                throw new Error('You must not change the length of an actions array.');
            }
            if (actions) {
                for (let i = 0; i < actions.length; i++) {
                    const returnEntry = actionReturns[i];
                    if (returnEntry && returnEntry.update) {
                        const actionEntry = actions[i];
                        if (Array.isArray(actionEntry) && actionEntry.length > 1) {
                            returnEntry.update(actionEntry[1]);
                        }
                        else {
                            returnEntry.update();
                        }
                    }
                }
            }
        },
        destroy() {
            for (let i = 0; i < actionReturns.length; i++) {
                const returnEntry = actionReturns[i];
                if (returnEntry && returnEntry.destroy) {
                    returnEntry.destroy();
                }
            }
        },
    };
}

/* node_modules/@smui/common/dist/elements/A.svelte generated by Svelte v3.49.0 */

function create_fragment$6(ctx) {
	let a;
	let useActions_action;
	let current;
	let mounted;
	let dispose;
	const default_slot_template = /*#slots*/ ctx[7].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);
	let a_levels = [{ href: /*href*/ ctx[1] }, /*$$restProps*/ ctx[4]];
	let a_data = {};

	for (let i = 0; i < a_levels.length; i += 1) {
		a_data = assign(a_data, a_levels[i]);
	}

	return {
		c() {
			a = element("a");
			if (default_slot) default_slot.c();
			set_attributes(a, a_data);
		},
		m(target, anchor) {
			insert(target, a, anchor);

			if (default_slot) {
				default_slot.m(a, null);
			}

			/*a_binding*/ ctx[8](a);
			current = true;

			if (!mounted) {
				dispose = [
					action_destroyer(useActions_action = useActions.call(null, a, /*use*/ ctx[0])),
					action_destroyer(/*forwardEvents*/ ctx[3].call(null, a))
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 64)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[6],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[6])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[6], dirty, null),
						null
					);
				}
			}

			set_attributes(a, a_data = get_spread_update(a_levels, [
				(!current || dirty & /*href*/ 2) && { href: /*href*/ ctx[1] },
				dirty & /*$$restProps*/ 16 && /*$$restProps*/ ctx[4]
			]));

			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(a);
			if (default_slot) default_slot.d(detaching);
			/*a_binding*/ ctx[8](null);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$5($$self, $$props, $$invalidate) {
	const omit_props_names = ["use","href","getElement"];
	let $$restProps = compute_rest_props($$props, omit_props_names);
	let { $$slots: slots = {}, $$scope } = $$props;
	let { use = [] } = $$props;
	let { href = 'javascript:void(0);' } = $$props;
	const forwardEvents = forwardEventsBuilder(get_current_component());
	let element;

	function getElement() {
		return element;
	}

	function a_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			element = $$value;
			$$invalidate(2, element);
		});
	}

	$$self.$$set = $$new_props => {
		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
		$$invalidate(4, $$restProps = compute_rest_props($$props, omit_props_names));
		if ('use' in $$new_props) $$invalidate(0, use = $$new_props.use);
		if ('href' in $$new_props) $$invalidate(1, href = $$new_props.href);
		if ('$$scope' in $$new_props) $$invalidate(6, $$scope = $$new_props.$$scope);
	};

	return [
		use,
		href,
		element,
		forwardEvents,
		$$restProps,
		getElement,
		$$scope,
		slots,
		a_binding
	];
}

class A$1 extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$5, create_fragment$6, safe_not_equal, { use: 0, href: 1, getElement: 5 });
	}

	get getElement() {
		return this.$$.ctx[5];
	}
}

/* node_modules/@smui/common/dist/elements/Button.svelte generated by Svelte v3.49.0 */

function create_fragment$5(ctx) {
	let button;
	let useActions_action;
	let current;
	let mounted;
	let dispose;
	const default_slot_template = /*#slots*/ ctx[6].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);
	let button_levels = [/*$$restProps*/ ctx[3]];
	let button_data = {};

	for (let i = 0; i < button_levels.length; i += 1) {
		button_data = assign(button_data, button_levels[i]);
	}

	return {
		c() {
			button = element("button");
			if (default_slot) default_slot.c();
			set_attributes(button, button_data);
		},
		m(target, anchor) {
			insert(target, button, anchor);

			if (default_slot) {
				default_slot.m(button, null);
			}

			if (button.autofocus) button.focus();
			/*button_binding*/ ctx[7](button);
			current = true;

			if (!mounted) {
				dispose = [
					action_destroyer(useActions_action = useActions.call(null, button, /*use*/ ctx[0])),
					action_destroyer(/*forwardEvents*/ ctx[2].call(null, button))
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 32)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[5],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[5])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[5], dirty, null),
						null
					);
				}
			}

			set_attributes(button, button_data = get_spread_update(button_levels, [dirty & /*$$restProps*/ 8 && /*$$restProps*/ ctx[3]]));
			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(button);
			if (default_slot) default_slot.d(detaching);
			/*button_binding*/ ctx[7](null);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$4($$self, $$props, $$invalidate) {
	const omit_props_names = ["use","getElement"];
	let $$restProps = compute_rest_props($$props, omit_props_names);
	let { $$slots: slots = {}, $$scope } = $$props;
	let { use = [] } = $$props;
	const forwardEvents = forwardEventsBuilder(get_current_component());
	let element;

	function getElement() {
		return element;
	}

	function button_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			element = $$value;
			$$invalidate(1, element);
		});
	}

	$$self.$$set = $$new_props => {
		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
		$$invalidate(3, $$restProps = compute_rest_props($$props, omit_props_names));
		if ('use' in $$new_props) $$invalidate(0, use = $$new_props.use);
		if ('$$scope' in $$new_props) $$invalidate(5, $$scope = $$new_props.$$scope);
	};

	return [
		use,
		element,
		forwardEvents,
		$$restProps,
		getElement,
		$$scope,
		slots,
		button_binding
	];
}

class Button$1 extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$4, create_fragment$5, safe_not_equal, { use: 0, getElement: 4 });
	}

	get getElement() {
		return this.$$.ctx[4];
	}
}

/* node_modules/@smui/common/dist/elements/I.svelte generated by Svelte v3.49.0 */

function create_fragment$4(ctx) {
	let i;
	let useActions_action;
	let current;
	let mounted;
	let dispose;
	const default_slot_template = /*#slots*/ ctx[6].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);
	let i_levels = [/*$$restProps*/ ctx[3]];
	let i_data = {};

	for (let i = 0; i < i_levels.length; i += 1) {
		i_data = assign(i_data, i_levels[i]);
	}

	return {
		c() {
			i = element("i");
			if (default_slot) default_slot.c();
			set_attributes(i, i_data);
		},
		m(target, anchor) {
			insert(target, i, anchor);

			if (default_slot) {
				default_slot.m(i, null);
			}

			/*i_binding*/ ctx[7](i);
			current = true;

			if (!mounted) {
				dispose = [
					action_destroyer(useActions_action = useActions.call(null, i, /*use*/ ctx[0])),
					action_destroyer(/*forwardEvents*/ ctx[2].call(null, i))
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 32)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[5],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[5])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[5], dirty, null),
						null
					);
				}
			}

			set_attributes(i, i_data = get_spread_update(i_levels, [dirty & /*$$restProps*/ 8 && /*$$restProps*/ ctx[3]]));
			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(i);
			if (default_slot) default_slot.d(detaching);
			/*i_binding*/ ctx[7](null);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$3($$self, $$props, $$invalidate) {
	const omit_props_names = ["use","getElement"];
	let $$restProps = compute_rest_props($$props, omit_props_names);
	let { $$slots: slots = {}, $$scope } = $$props;
	let { use = [] } = $$props;
	const forwardEvents = forwardEventsBuilder(get_current_component());
	let element;

	function getElement() {
		return element;
	}

	function i_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			element = $$value;
			$$invalidate(1, element);
		});
	}

	$$self.$$set = $$new_props => {
		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
		$$invalidate(3, $$restProps = compute_rest_props($$props, omit_props_names));
		if ('use' in $$new_props) $$invalidate(0, use = $$new_props.use);
		if ('$$scope' in $$new_props) $$invalidate(5, $$scope = $$new_props.$$scope);
	};

	return [
		use,
		element,
		forwardEvents,
		$$restProps,
		getElement,
		$$scope,
		slots,
		i_binding
	];
}

class I extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$3, create_fragment$4, safe_not_equal, { use: 0, getElement: 4 });
	}

	get getElement() {
		return this.$$.ctx[4];
	}
}

/* node_modules/@smui/common/dist/elements/Svg.svelte generated by Svelte v3.49.0 */

function create_fragment$3(ctx) {
	let svg;
	let useActions_action;
	let current;
	let mounted;
	let dispose;
	const default_slot_template = /*#slots*/ ctx[6].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);
	let svg_levels = [/*$$restProps*/ ctx[3]];
	let svg_data = {};

	for (let i = 0; i < svg_levels.length; i += 1) {
		svg_data = assign(svg_data, svg_levels[i]);
	}

	return {
		c() {
			svg = svg_element("svg");
			if (default_slot) default_slot.c();
			set_svg_attributes(svg, svg_data);
		},
		m(target, anchor) {
			insert(target, svg, anchor);

			if (default_slot) {
				default_slot.m(svg, null);
			}

			/*svg_binding*/ ctx[7](svg);
			current = true;

			if (!mounted) {
				dispose = [
					action_destroyer(useActions_action = useActions.call(null, svg, /*use*/ ctx[0])),
					action_destroyer(/*forwardEvents*/ ctx[2].call(null, svg))
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 32)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[5],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[5])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[5], dirty, null),
						null
					);
				}
			}

			set_svg_attributes(svg, svg_data = get_spread_update(svg_levels, [dirty & /*$$restProps*/ 8 && /*$$restProps*/ ctx[3]]));
			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(svg);
			if (default_slot) default_slot.d(detaching);
			/*svg_binding*/ ctx[7](null);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$2($$self, $$props, $$invalidate) {
	const omit_props_names = ["use","getElement"];
	let $$restProps = compute_rest_props($$props, omit_props_names);
	let { $$slots: slots = {}, $$scope } = $$props;
	let { use = [] } = $$props;
	const forwardEvents = forwardEventsBuilder(get_current_component());
	let element;

	function getElement() {
		return element;
	}

	function svg_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			element = $$value;
			$$invalidate(1, element);
		});
	}

	$$self.$$set = $$new_props => {
		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
		$$invalidate(3, $$restProps = compute_rest_props($$props, omit_props_names));
		if ('use' in $$new_props) $$invalidate(0, use = $$new_props.use);
		if ('$$scope' in $$new_props) $$invalidate(5, $$scope = $$new_props.$$scope);
	};

	return [
		use,
		element,
		forwardEvents,
		$$restProps,
		getElement,
		$$scope,
		slots,
		svg_binding
	];
}

class Svg$1 extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$2, create_fragment$3, safe_not_equal, { use: 0, getElement: 4 });
	}

	get getElement() {
		return this.$$.ctx[4];
	}
}

const A = A$1;
const Button = Button$1;
const Svg = Svg$1;

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

function __values(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}

function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

function __spreadArray(to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
}

/**
 * @license
 * Copyright 2016 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var MDCFoundation = /** @class */ (function () {
    function MDCFoundation(adapter) {
        if (adapter === void 0) { adapter = {}; }
        this.adapter = adapter;
    }
    Object.defineProperty(MDCFoundation, "cssClasses", {
        get: function () {
            // Classes extending MDCFoundation should implement this method to return an object which exports every
            // CSS class the foundation class needs as a property. e.g. {ACTIVE: 'mdc-component--active'}
            return {};
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MDCFoundation, "strings", {
        get: function () {
            // Classes extending MDCFoundation should implement this method to return an object which exports all
            // semantic strings as constants. e.g. {ARIA_ROLE: 'tablist'}
            return {};
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MDCFoundation, "numbers", {
        get: function () {
            // Classes extending MDCFoundation should implement this method to return an object which exports all
            // of its semantic numbers as constants. e.g. {ANIMATION_DELAY_MS: 350}
            return {};
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MDCFoundation, "defaultAdapter", {
        get: function () {
            // Classes extending MDCFoundation may choose to implement this getter in order to provide a convenient
            // way of viewing the necessary methods of an adapter. In the future, this could also be used for adapter
            // validation.
            return {};
        },
        enumerable: false,
        configurable: true
    });
    MDCFoundation.prototype.init = function () {
        // Subclasses should override this method to perform initialization routines (registering events, etc.)
    };
    MDCFoundation.prototype.destroy = function () {
        // Subclasses should override this method to perform de-initialization routines (de-registering events, etc.)
    };
    return MDCFoundation;
}());

/**
 * @license
 * Copyright 2016 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var MDCComponent = /** @class */ (function () {
    function MDCComponent(root, foundation) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        this.root = root;
        this.initialize.apply(this, __spreadArray([], __read(args)));
        // Note that we initialize foundation here and not within the constructor's
        // default param so that this.root is defined and can be used within the
        // foundation class.
        this.foundation =
            foundation === undefined ? this.getDefaultFoundation() : foundation;
        this.foundation.init();
        this.initialSyncWithDOM();
    }
    MDCComponent.attachTo = function (root) {
        // Subclasses which extend MDCBase should provide an attachTo() method that takes a root element and
        // returns an instantiated component with its root set to that element. Also note that in the cases of
        // subclasses, an explicit foundation class will not have to be passed in; it will simply be initialized
        // from getDefaultFoundation().
        return new MDCComponent(root, new MDCFoundation({}));
    };
    /* istanbul ignore next: method param only exists for typing purposes; it does not need to be unit tested */
    MDCComponent.prototype.initialize = function () {
        // Subclasses can override this to do any additional setup work that would be considered part of a
        // "constructor". Essentially, it is a hook into the parent constructor before the foundation is
        // initialized. Any additional arguments besides root and foundation will be passed in here.
    };
    MDCComponent.prototype.getDefaultFoundation = function () {
        // Subclasses must override this method to return a properly configured foundation class for the
        // component.
        throw new Error('Subclasses must override getDefaultFoundation to return a properly configured ' +
            'foundation class');
    };
    MDCComponent.prototype.initialSyncWithDOM = function () {
        // Subclasses should override this method if they need to perform work to synchronize with a host DOM
        // object. An example of this would be a form control wrapper that needs to synchronize its internal state
        // to some property or attribute of the host DOM. Please note: this is *not* the place to perform DOM
        // reads/writes that would cause layout / paint, as this is called synchronously from within the constructor.
    };
    MDCComponent.prototype.destroy = function () {
        // Subclasses may implement this method to release any resources / deregister any listeners they have
        // attached. An example of this might be deregistering a resize event from the window object.
        this.foundation.destroy();
    };
    MDCComponent.prototype.listen = function (evtType, handler, options) {
        this.root.addEventListener(evtType, handler, options);
    };
    MDCComponent.prototype.unlisten = function (evtType, handler, options) {
        this.root.removeEventListener(evtType, handler, options);
    };
    /**
     * Fires a cross-browser-compatible custom event from the component root of the given type, with the given data.
     */
    MDCComponent.prototype.emit = function (evtType, evtData, shouldBubble) {
        if (shouldBubble === void 0) { shouldBubble = false; }
        var evt;
        if (typeof CustomEvent === 'function') {
            evt = new CustomEvent(evtType, {
                bubbles: shouldBubble,
                detail: evtData,
            });
        }
        else {
            evt = document.createEvent('CustomEvent');
            evt.initCustomEvent(evtType, shouldBubble, false, evtData);
        }
        this.root.dispatchEvent(evt);
    };
    return MDCComponent;
}());

/**
 * @license
 * Copyright 2019 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
/**
 * Determine whether the current browser supports passive event listeners, and
 * if so, use them.
 */
function applyPassive$1(globalObj) {
    if (globalObj === void 0) { globalObj = window; }
    return supportsPassiveOption(globalObj) ?
        { passive: true } :
        false;
}
function supportsPassiveOption(globalObj) {
    if (globalObj === void 0) { globalObj = window; }
    // See
    // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
    var passiveSupported = false;
    try {
        var options = {
            // This function will be called when the browser
            // attempts to access the passive property.
            get passive() {
                passiveSupported = true;
                return false;
            }
        };
        var handler = function () { };
        globalObj.document.addEventListener('test', handler, options);
        globalObj.document.removeEventListener('test', handler, options);
    }
    catch (err) {
        passiveSupported = false;
    }
    return passiveSupported;
}

var events = /*#__PURE__*/Object.freeze({
    __proto__: null,
    applyPassive: applyPassive$1
});

/**
 * @license
 * Copyright 2018 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
/**
 * @fileoverview A "ponyfill" is a polyfill that doesn't modify the global prototype chain.
 * This makes ponyfills safer than traditional polyfills, especially for libraries like MDC.
 */
function closest(element, selector) {
    if (element.closest) {
        return element.closest(selector);
    }
    var el = element;
    while (el) {
        if (matches$1(el, selector)) {
            return el;
        }
        el = el.parentElement;
    }
    return null;
}
function matches$1(element, selector) {
    var nativeMatches = element.matches
        || element.webkitMatchesSelector
        || element.msMatchesSelector;
    return nativeMatches.call(element, selector);
}
/**
 * Used to compute the estimated scroll width of elements. When an element is
 * hidden due to display: none; being applied to a parent element, the width is
 * returned as 0. However, the element will have a true width once no longer
 * inside a display: none context. This method computes an estimated width when
 * the element is hidden or returns the true width when the element is visble.
 * @param {Element} element the element whose width to estimate
 */
function estimateScrollWidth(element) {
    // Check the offsetParent. If the element inherits display: none from any
    // parent, the offsetParent property will be null (see
    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent).
    // This check ensures we only clone the node when necessary.
    var htmlEl = element;
    if (htmlEl.offsetParent !== null) {
        return htmlEl.scrollWidth;
    }
    var clone = htmlEl.cloneNode(true);
    clone.style.setProperty('position', 'absolute');
    clone.style.setProperty('transform', 'translate(-9999px, -9999px)');
    document.documentElement.appendChild(clone);
    var scrollWidth = clone.scrollWidth;
    document.documentElement.removeChild(clone);
    return scrollWidth;
}

var ponyfill = /*#__PURE__*/Object.freeze({
    __proto__: null,
    closest: closest,
    matches: matches$1,
    estimateScrollWidth: estimateScrollWidth
});

/**
 * @license
 * Copyright 2016 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var cssClasses$1 = {
    // Ripple is a special case where the "root" component is really a "mixin" of sorts,
    // given that it's an 'upgrade' to an existing component. That being said it is the root
    // CSS class that all other CSS classes derive from.
    BG_FOCUSED: 'mdc-ripple-upgraded--background-focused',
    FG_ACTIVATION: 'mdc-ripple-upgraded--foreground-activation',
    FG_DEACTIVATION: 'mdc-ripple-upgraded--foreground-deactivation',
    ROOT: 'mdc-ripple-upgraded',
    UNBOUNDED: 'mdc-ripple-upgraded--unbounded',
};
var strings$2 = {
    VAR_FG_SCALE: '--mdc-ripple-fg-scale',
    VAR_FG_SIZE: '--mdc-ripple-fg-size',
    VAR_FG_TRANSLATE_END: '--mdc-ripple-fg-translate-end',
    VAR_FG_TRANSLATE_START: '--mdc-ripple-fg-translate-start',
    VAR_LEFT: '--mdc-ripple-left',
    VAR_TOP: '--mdc-ripple-top',
};
var numbers = {
    DEACTIVATION_TIMEOUT_MS: 225,
    FG_DEACTIVATION_MS: 150,
    INITIAL_ORIGIN_SCALE: 0.6,
    PADDING: 10,
    TAP_DELAY_MS: 300, // Delay between touch and simulated mouse events on touch devices
};

/**
 * Stores result from supportsCssVariables to avoid redundant processing to
 * detect CSS custom variable support.
 */
var supportsCssVariables_;
function supportsCssVariables(windowObj, forceRefresh) {
    if (forceRefresh === void 0) { forceRefresh = false; }
    var CSS = windowObj.CSS;
    var supportsCssVars = supportsCssVariables_;
    if (typeof supportsCssVariables_ === 'boolean' && !forceRefresh) {
        return supportsCssVariables_;
    }
    var supportsFunctionPresent = CSS && typeof CSS.supports === 'function';
    if (!supportsFunctionPresent) {
        return false;
    }
    var explicitlySupportsCssVars = CSS.supports('--css-vars', 'yes');
    // See: https://bugs.webkit.org/show_bug.cgi?id=154669
    // See: README section on Safari
    var weAreFeatureDetectingSafari10plus = (CSS.supports('(--css-vars: yes)') &&
        CSS.supports('color', '#00000000'));
    supportsCssVars =
        explicitlySupportsCssVars || weAreFeatureDetectingSafari10plus;
    if (!forceRefresh) {
        supportsCssVariables_ = supportsCssVars;
    }
    return supportsCssVars;
}
function getNormalizedEventCoords(evt, pageOffset, clientRect) {
    if (!evt) {
        return { x: 0, y: 0 };
    }
    var x = pageOffset.x, y = pageOffset.y;
    var documentX = x + clientRect.left;
    var documentY = y + clientRect.top;
    var normalizedX;
    var normalizedY;
    // Determine touch point relative to the ripple container.
    if (evt.type === 'touchstart') {
        var touchEvent = evt;
        normalizedX = touchEvent.changedTouches[0].pageX - documentX;
        normalizedY = touchEvent.changedTouches[0].pageY - documentY;
    }
    else {
        var mouseEvent = evt;
        normalizedX = mouseEvent.pageX - documentX;
        normalizedY = mouseEvent.pageY - documentY;
    }
    return { x: normalizedX, y: normalizedY };
}

/**
 * @license
 * Copyright 2016 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
// Activation events registered on the root element of each instance for activation
var ACTIVATION_EVENT_TYPES = [
    'touchstart', 'pointerdown', 'mousedown', 'keydown',
];
// Deactivation events registered on documentElement when a pointer-related down event occurs
var POINTER_DEACTIVATION_EVENT_TYPES = [
    'touchend', 'pointerup', 'mouseup', 'contextmenu',
];
// simultaneous nested activations
var activatedTargets = [];
var MDCRippleFoundation = /** @class */ (function (_super) {
    __extends(MDCRippleFoundation, _super);
    function MDCRippleFoundation(adapter) {
        var _this = _super.call(this, __assign(__assign({}, MDCRippleFoundation.defaultAdapter), adapter)) || this;
        _this.activationAnimationHasEnded = false;
        _this.activationTimer = 0;
        _this.fgDeactivationRemovalTimer = 0;
        _this.fgScale = '0';
        _this.frame = { width: 0, height: 0 };
        _this.initialSize = 0;
        _this.layoutFrame = 0;
        _this.maxRadius = 0;
        _this.unboundedCoords = { left: 0, top: 0 };
        _this.activationState = _this.defaultActivationState();
        _this.activationTimerCallback = function () {
            _this.activationAnimationHasEnded = true;
            _this.runDeactivationUXLogicIfReady();
        };
        _this.activateHandler = function (e) {
            _this.activateImpl(e);
        };
        _this.deactivateHandler = function () {
            _this.deactivateImpl();
        };
        _this.focusHandler = function () {
            _this.handleFocus();
        };
        _this.blurHandler = function () {
            _this.handleBlur();
        };
        _this.resizeHandler = function () {
            _this.layout();
        };
        return _this;
    }
    Object.defineProperty(MDCRippleFoundation, "cssClasses", {
        get: function () {
            return cssClasses$1;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MDCRippleFoundation, "strings", {
        get: function () {
            return strings$2;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MDCRippleFoundation, "numbers", {
        get: function () {
            return numbers;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MDCRippleFoundation, "defaultAdapter", {
        get: function () {
            return {
                addClass: function () { return undefined; },
                browserSupportsCssVars: function () { return true; },
                computeBoundingRect: function () {
                    return ({ top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0 });
                },
                containsEventTarget: function () { return true; },
                deregisterDocumentInteractionHandler: function () { return undefined; },
                deregisterInteractionHandler: function () { return undefined; },
                deregisterResizeHandler: function () { return undefined; },
                getWindowPageOffset: function () { return ({ x: 0, y: 0 }); },
                isSurfaceActive: function () { return true; },
                isSurfaceDisabled: function () { return true; },
                isUnbounded: function () { return true; },
                registerDocumentInteractionHandler: function () { return undefined; },
                registerInteractionHandler: function () { return undefined; },
                registerResizeHandler: function () { return undefined; },
                removeClass: function () { return undefined; },
                updateCssVariable: function () { return undefined; },
            };
        },
        enumerable: false,
        configurable: true
    });
    MDCRippleFoundation.prototype.init = function () {
        var _this = this;
        var supportsPressRipple = this.supportsPressRipple();
        this.registerRootHandlers(supportsPressRipple);
        if (supportsPressRipple) {
            var _a = MDCRippleFoundation.cssClasses, ROOT_1 = _a.ROOT, UNBOUNDED_1 = _a.UNBOUNDED;
            requestAnimationFrame(function () {
                _this.adapter.addClass(ROOT_1);
                if (_this.adapter.isUnbounded()) {
                    _this.adapter.addClass(UNBOUNDED_1);
                    // Unbounded ripples need layout logic applied immediately to set coordinates for both shade and ripple
                    _this.layoutInternal();
                }
            });
        }
    };
    MDCRippleFoundation.prototype.destroy = function () {
        var _this = this;
        if (this.supportsPressRipple()) {
            if (this.activationTimer) {
                clearTimeout(this.activationTimer);
                this.activationTimer = 0;
                this.adapter.removeClass(MDCRippleFoundation.cssClasses.FG_ACTIVATION);
            }
            if (this.fgDeactivationRemovalTimer) {
                clearTimeout(this.fgDeactivationRemovalTimer);
                this.fgDeactivationRemovalTimer = 0;
                this.adapter.removeClass(MDCRippleFoundation.cssClasses.FG_DEACTIVATION);
            }
            var _a = MDCRippleFoundation.cssClasses, ROOT_2 = _a.ROOT, UNBOUNDED_2 = _a.UNBOUNDED;
            requestAnimationFrame(function () {
                _this.adapter.removeClass(ROOT_2);
                _this.adapter.removeClass(UNBOUNDED_2);
                _this.removeCssVars();
            });
        }
        this.deregisterRootHandlers();
        this.deregisterDeactivationHandlers();
    };
    /**
     * @param evt Optional event containing position information.
     */
    MDCRippleFoundation.prototype.activate = function (evt) {
        this.activateImpl(evt);
    };
    MDCRippleFoundation.prototype.deactivate = function () {
        this.deactivateImpl();
    };
    MDCRippleFoundation.prototype.layout = function () {
        var _this = this;
        if (this.layoutFrame) {
            cancelAnimationFrame(this.layoutFrame);
        }
        this.layoutFrame = requestAnimationFrame(function () {
            _this.layoutInternal();
            _this.layoutFrame = 0;
        });
    };
    MDCRippleFoundation.prototype.setUnbounded = function (unbounded) {
        var UNBOUNDED = MDCRippleFoundation.cssClasses.UNBOUNDED;
        if (unbounded) {
            this.adapter.addClass(UNBOUNDED);
        }
        else {
            this.adapter.removeClass(UNBOUNDED);
        }
    };
    MDCRippleFoundation.prototype.handleFocus = function () {
        var _this = this;
        requestAnimationFrame(function () { return _this.adapter.addClass(MDCRippleFoundation.cssClasses.BG_FOCUSED); });
    };
    MDCRippleFoundation.prototype.handleBlur = function () {
        var _this = this;
        requestAnimationFrame(function () { return _this.adapter.removeClass(MDCRippleFoundation.cssClasses.BG_FOCUSED); });
    };
    /**
     * We compute this property so that we are not querying information about the client
     * until the point in time where the foundation requests it. This prevents scenarios where
     * client-side feature-detection may happen too early, such as when components are rendered on the server
     * and then initialized at mount time on the client.
     */
    MDCRippleFoundation.prototype.supportsPressRipple = function () {
        return this.adapter.browserSupportsCssVars();
    };
    MDCRippleFoundation.prototype.defaultActivationState = function () {
        return {
            activationEvent: undefined,
            hasDeactivationUXRun: false,
            isActivated: false,
            isProgrammatic: false,
            wasActivatedByPointer: false,
            wasElementMadeActive: false,
        };
    };
    /**
     * supportsPressRipple Passed from init to save a redundant function call
     */
    MDCRippleFoundation.prototype.registerRootHandlers = function (supportsPressRipple) {
        var e_1, _a;
        if (supportsPressRipple) {
            try {
                for (var ACTIVATION_EVENT_TYPES_1 = __values(ACTIVATION_EVENT_TYPES), ACTIVATION_EVENT_TYPES_1_1 = ACTIVATION_EVENT_TYPES_1.next(); !ACTIVATION_EVENT_TYPES_1_1.done; ACTIVATION_EVENT_TYPES_1_1 = ACTIVATION_EVENT_TYPES_1.next()) {
                    var evtType = ACTIVATION_EVENT_TYPES_1_1.value;
                    this.adapter.registerInteractionHandler(evtType, this.activateHandler);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (ACTIVATION_EVENT_TYPES_1_1 && !ACTIVATION_EVENT_TYPES_1_1.done && (_a = ACTIVATION_EVENT_TYPES_1.return)) _a.call(ACTIVATION_EVENT_TYPES_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            if (this.adapter.isUnbounded()) {
                this.adapter.registerResizeHandler(this.resizeHandler);
            }
        }
        this.adapter.registerInteractionHandler('focus', this.focusHandler);
        this.adapter.registerInteractionHandler('blur', this.blurHandler);
    };
    MDCRippleFoundation.prototype.registerDeactivationHandlers = function (evt) {
        var e_2, _a;
        if (evt.type === 'keydown') {
            this.adapter.registerInteractionHandler('keyup', this.deactivateHandler);
        }
        else {
            try {
                for (var POINTER_DEACTIVATION_EVENT_TYPES_1 = __values(POINTER_DEACTIVATION_EVENT_TYPES), POINTER_DEACTIVATION_EVENT_TYPES_1_1 = POINTER_DEACTIVATION_EVENT_TYPES_1.next(); !POINTER_DEACTIVATION_EVENT_TYPES_1_1.done; POINTER_DEACTIVATION_EVENT_TYPES_1_1 = POINTER_DEACTIVATION_EVENT_TYPES_1.next()) {
                    var evtType = POINTER_DEACTIVATION_EVENT_TYPES_1_1.value;
                    this.adapter.registerDocumentInteractionHandler(evtType, this.deactivateHandler);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (POINTER_DEACTIVATION_EVENT_TYPES_1_1 && !POINTER_DEACTIVATION_EVENT_TYPES_1_1.done && (_a = POINTER_DEACTIVATION_EVENT_TYPES_1.return)) _a.call(POINTER_DEACTIVATION_EVENT_TYPES_1);
                }
                finally { if (e_2) throw e_2.error; }
            }
        }
    };
    MDCRippleFoundation.prototype.deregisterRootHandlers = function () {
        var e_3, _a;
        try {
            for (var ACTIVATION_EVENT_TYPES_2 = __values(ACTIVATION_EVENT_TYPES), ACTIVATION_EVENT_TYPES_2_1 = ACTIVATION_EVENT_TYPES_2.next(); !ACTIVATION_EVENT_TYPES_2_1.done; ACTIVATION_EVENT_TYPES_2_1 = ACTIVATION_EVENT_TYPES_2.next()) {
                var evtType = ACTIVATION_EVENT_TYPES_2_1.value;
                this.adapter.deregisterInteractionHandler(evtType, this.activateHandler);
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (ACTIVATION_EVENT_TYPES_2_1 && !ACTIVATION_EVENT_TYPES_2_1.done && (_a = ACTIVATION_EVENT_TYPES_2.return)) _a.call(ACTIVATION_EVENT_TYPES_2);
            }
            finally { if (e_3) throw e_3.error; }
        }
        this.adapter.deregisterInteractionHandler('focus', this.focusHandler);
        this.adapter.deregisterInteractionHandler('blur', this.blurHandler);
        if (this.adapter.isUnbounded()) {
            this.adapter.deregisterResizeHandler(this.resizeHandler);
        }
    };
    MDCRippleFoundation.prototype.deregisterDeactivationHandlers = function () {
        var e_4, _a;
        this.adapter.deregisterInteractionHandler('keyup', this.deactivateHandler);
        try {
            for (var POINTER_DEACTIVATION_EVENT_TYPES_2 = __values(POINTER_DEACTIVATION_EVENT_TYPES), POINTER_DEACTIVATION_EVENT_TYPES_2_1 = POINTER_DEACTIVATION_EVENT_TYPES_2.next(); !POINTER_DEACTIVATION_EVENT_TYPES_2_1.done; POINTER_DEACTIVATION_EVENT_TYPES_2_1 = POINTER_DEACTIVATION_EVENT_TYPES_2.next()) {
                var evtType = POINTER_DEACTIVATION_EVENT_TYPES_2_1.value;
                this.adapter.deregisterDocumentInteractionHandler(evtType, this.deactivateHandler);
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (POINTER_DEACTIVATION_EVENT_TYPES_2_1 && !POINTER_DEACTIVATION_EVENT_TYPES_2_1.done && (_a = POINTER_DEACTIVATION_EVENT_TYPES_2.return)) _a.call(POINTER_DEACTIVATION_EVENT_TYPES_2);
            }
            finally { if (e_4) throw e_4.error; }
        }
    };
    MDCRippleFoundation.prototype.removeCssVars = function () {
        var _this = this;
        var rippleStrings = MDCRippleFoundation.strings;
        var keys = Object.keys(rippleStrings);
        keys.forEach(function (key) {
            if (key.indexOf('VAR_') === 0) {
                _this.adapter.updateCssVariable(rippleStrings[key], null);
            }
        });
    };
    MDCRippleFoundation.prototype.activateImpl = function (evt) {
        var _this = this;
        if (this.adapter.isSurfaceDisabled()) {
            return;
        }
        var activationState = this.activationState;
        if (activationState.isActivated) {
            return;
        }
        // Avoid reacting to follow-on events fired by touch device after an already-processed user interaction
        var previousActivationEvent = this.previousActivationEvent;
        var isSameInteraction = previousActivationEvent && evt !== undefined && previousActivationEvent.type !== evt.type;
        if (isSameInteraction) {
            return;
        }
        activationState.isActivated = true;
        activationState.isProgrammatic = evt === undefined;
        activationState.activationEvent = evt;
        activationState.wasActivatedByPointer = activationState.isProgrammatic ? false : evt !== undefined && (evt.type === 'mousedown' || evt.type === 'touchstart' || evt.type === 'pointerdown');
        var hasActivatedChild = evt !== undefined &&
            activatedTargets.length > 0 &&
            activatedTargets.some(function (target) { return _this.adapter.containsEventTarget(target); });
        if (hasActivatedChild) {
            // Immediately reset activation state, while preserving logic that prevents touch follow-on events
            this.resetActivationState();
            return;
        }
        if (evt !== undefined) {
            activatedTargets.push(evt.target);
            this.registerDeactivationHandlers(evt);
        }
        activationState.wasElementMadeActive = this.checkElementMadeActive(evt);
        if (activationState.wasElementMadeActive) {
            this.animateActivation();
        }
        requestAnimationFrame(function () {
            // Reset array on next frame after the current event has had a chance to bubble to prevent ancestor ripples
            activatedTargets = [];
            if (!activationState.wasElementMadeActive
                && evt !== undefined
                && (evt.key === ' ' || evt.keyCode === 32)) {
                // If space was pressed, try again within an rAF call to detect :active, because different UAs report
                // active states inconsistently when they're called within event handling code:
                // - https://bugs.chromium.org/p/chromium/issues/detail?id=635971
                // - https://bugzilla.mozilla.org/show_bug.cgi?id=1293741
                // We try first outside rAF to support Edge, which does not exhibit this problem, but will crash if a CSS
                // variable is set within a rAF callback for a submit button interaction (#2241).
                activationState.wasElementMadeActive = _this.checkElementMadeActive(evt);
                if (activationState.wasElementMadeActive) {
                    _this.animateActivation();
                }
            }
            if (!activationState.wasElementMadeActive) {
                // Reset activation state immediately if element was not made active.
                _this.activationState = _this.defaultActivationState();
            }
        });
    };
    MDCRippleFoundation.prototype.checkElementMadeActive = function (evt) {
        return (evt !== undefined && evt.type === 'keydown') ?
            this.adapter.isSurfaceActive() :
            true;
    };
    MDCRippleFoundation.prototype.animateActivation = function () {
        var _this = this;
        var _a = MDCRippleFoundation.strings, VAR_FG_TRANSLATE_START = _a.VAR_FG_TRANSLATE_START, VAR_FG_TRANSLATE_END = _a.VAR_FG_TRANSLATE_END;
        var _b = MDCRippleFoundation.cssClasses, FG_DEACTIVATION = _b.FG_DEACTIVATION, FG_ACTIVATION = _b.FG_ACTIVATION;
        var DEACTIVATION_TIMEOUT_MS = MDCRippleFoundation.numbers.DEACTIVATION_TIMEOUT_MS;
        this.layoutInternal();
        var translateStart = '';
        var translateEnd = '';
        if (!this.adapter.isUnbounded()) {
            var _c = this.getFgTranslationCoordinates(), startPoint = _c.startPoint, endPoint = _c.endPoint;
            translateStart = startPoint.x + "px, " + startPoint.y + "px";
            translateEnd = endPoint.x + "px, " + endPoint.y + "px";
        }
        this.adapter.updateCssVariable(VAR_FG_TRANSLATE_START, translateStart);
        this.adapter.updateCssVariable(VAR_FG_TRANSLATE_END, translateEnd);
        // Cancel any ongoing activation/deactivation animations
        clearTimeout(this.activationTimer);
        clearTimeout(this.fgDeactivationRemovalTimer);
        this.rmBoundedActivationClasses();
        this.adapter.removeClass(FG_DEACTIVATION);
        // Force layout in order to re-trigger the animation.
        this.adapter.computeBoundingRect();
        this.adapter.addClass(FG_ACTIVATION);
        this.activationTimer = setTimeout(function () {
            _this.activationTimerCallback();
        }, DEACTIVATION_TIMEOUT_MS);
    };
    MDCRippleFoundation.prototype.getFgTranslationCoordinates = function () {
        var _a = this.activationState, activationEvent = _a.activationEvent, wasActivatedByPointer = _a.wasActivatedByPointer;
        var startPoint;
        if (wasActivatedByPointer) {
            startPoint = getNormalizedEventCoords(activationEvent, this.adapter.getWindowPageOffset(), this.adapter.computeBoundingRect());
        }
        else {
            startPoint = {
                x: this.frame.width / 2,
                y: this.frame.height / 2,
            };
        }
        // Center the element around the start point.
        startPoint = {
            x: startPoint.x - (this.initialSize / 2),
            y: startPoint.y - (this.initialSize / 2),
        };
        var endPoint = {
            x: (this.frame.width / 2) - (this.initialSize / 2),
            y: (this.frame.height / 2) - (this.initialSize / 2),
        };
        return { startPoint: startPoint, endPoint: endPoint };
    };
    MDCRippleFoundation.prototype.runDeactivationUXLogicIfReady = function () {
        var _this = this;
        // This method is called both when a pointing device is released, and when the activation animation ends.
        // The deactivation animation should only run after both of those occur.
        var FG_DEACTIVATION = MDCRippleFoundation.cssClasses.FG_DEACTIVATION;
        var _a = this.activationState, hasDeactivationUXRun = _a.hasDeactivationUXRun, isActivated = _a.isActivated;
        var activationHasEnded = hasDeactivationUXRun || !isActivated;
        if (activationHasEnded && this.activationAnimationHasEnded) {
            this.rmBoundedActivationClasses();
            this.adapter.addClass(FG_DEACTIVATION);
            this.fgDeactivationRemovalTimer = setTimeout(function () {
                _this.adapter.removeClass(FG_DEACTIVATION);
            }, numbers.FG_DEACTIVATION_MS);
        }
    };
    MDCRippleFoundation.prototype.rmBoundedActivationClasses = function () {
        var FG_ACTIVATION = MDCRippleFoundation.cssClasses.FG_ACTIVATION;
        this.adapter.removeClass(FG_ACTIVATION);
        this.activationAnimationHasEnded = false;
        this.adapter.computeBoundingRect();
    };
    MDCRippleFoundation.prototype.resetActivationState = function () {
        var _this = this;
        this.previousActivationEvent = this.activationState.activationEvent;
        this.activationState = this.defaultActivationState();
        // Touch devices may fire additional events for the same interaction within a short time.
        // Store the previous event until it's safe to assume that subsequent events are for new interactions.
        setTimeout(function () { return _this.previousActivationEvent = undefined; }, MDCRippleFoundation.numbers.TAP_DELAY_MS);
    };
    MDCRippleFoundation.prototype.deactivateImpl = function () {
        var _this = this;
        var activationState = this.activationState;
        // This can happen in scenarios such as when you have a keyup event that blurs the element.
        if (!activationState.isActivated) {
            return;
        }
        var state = __assign({}, activationState);
        if (activationState.isProgrammatic) {
            requestAnimationFrame(function () {
                _this.animateDeactivation(state);
            });
            this.resetActivationState();
        }
        else {
            this.deregisterDeactivationHandlers();
            requestAnimationFrame(function () {
                _this.activationState.hasDeactivationUXRun = true;
                _this.animateDeactivation(state);
                _this.resetActivationState();
            });
        }
    };
    MDCRippleFoundation.prototype.animateDeactivation = function (_a) {
        var wasActivatedByPointer = _a.wasActivatedByPointer, wasElementMadeActive = _a.wasElementMadeActive;
        if (wasActivatedByPointer || wasElementMadeActive) {
            this.runDeactivationUXLogicIfReady();
        }
    };
    MDCRippleFoundation.prototype.layoutInternal = function () {
        var _this = this;
        this.frame = this.adapter.computeBoundingRect();
        var maxDim = Math.max(this.frame.height, this.frame.width);
        // Surface diameter is treated differently for unbounded vs. bounded ripples.
        // Unbounded ripple diameter is calculated smaller since the surface is expected to already be padded appropriately
        // to extend the hitbox, and the ripple is expected to meet the edges of the padded hitbox (which is typically
        // square). Bounded ripples, on the other hand, are fully expected to expand beyond the surface's longest diameter
        // (calculated based on the diagonal plus a constant padding), and are clipped at the surface's border via
        // `overflow: hidden`.
        var getBoundedRadius = function () {
            var hypotenuse = Math.sqrt(Math.pow(_this.frame.width, 2) + Math.pow(_this.frame.height, 2));
            return hypotenuse + MDCRippleFoundation.numbers.PADDING;
        };
        this.maxRadius = this.adapter.isUnbounded() ? maxDim : getBoundedRadius();
        // Ripple is sized as a fraction of the largest dimension of the surface, then scales up using a CSS scale transform
        var initialSize = Math.floor(maxDim * MDCRippleFoundation.numbers.INITIAL_ORIGIN_SCALE);
        // Unbounded ripple size should always be even number to equally center align.
        if (this.adapter.isUnbounded() && initialSize % 2 !== 0) {
            this.initialSize = initialSize - 1;
        }
        else {
            this.initialSize = initialSize;
        }
        this.fgScale = "" + this.maxRadius / this.initialSize;
        this.updateLayoutCssVars();
    };
    MDCRippleFoundation.prototype.updateLayoutCssVars = function () {
        var _a = MDCRippleFoundation.strings, VAR_FG_SIZE = _a.VAR_FG_SIZE, VAR_LEFT = _a.VAR_LEFT, VAR_TOP = _a.VAR_TOP, VAR_FG_SCALE = _a.VAR_FG_SCALE;
        this.adapter.updateCssVariable(VAR_FG_SIZE, this.initialSize + "px");
        this.adapter.updateCssVariable(VAR_FG_SCALE, this.fgScale);
        if (this.adapter.isUnbounded()) {
            this.unboundedCoords = {
                left: Math.round((this.frame.width / 2) - (this.initialSize / 2)),
                top: Math.round((this.frame.height / 2) - (this.initialSize / 2)),
            };
            this.adapter.updateCssVariable(VAR_LEFT, this.unboundedCoords.left + "px");
            this.adapter.updateCssVariable(VAR_TOP, this.unboundedCoords.top + "px");
        }
    };
    return MDCRippleFoundation;
}(MDCFoundation));

/**
 * @license
 * Copyright 2016 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var MDCRipple = /** @class */ (function (_super) {
    __extends(MDCRipple, _super);
    function MDCRipple() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.disabled = false;
        return _this;
    }
    MDCRipple.attachTo = function (root, opts) {
        if (opts === void 0) { opts = {
            isUnbounded: undefined
        }; }
        var ripple = new MDCRipple(root);
        // Only override unbounded behavior if option is explicitly specified
        if (opts.isUnbounded !== undefined) {
            ripple.unbounded = opts.isUnbounded;
        }
        return ripple;
    };
    MDCRipple.createAdapter = function (instance) {
        return {
            addClass: function (className) { return instance.root.classList.add(className); },
            browserSupportsCssVars: function () { return supportsCssVariables(window); },
            computeBoundingRect: function () { return instance.root.getBoundingClientRect(); },
            containsEventTarget: function (target) { return instance.root.contains(target); },
            deregisterDocumentInteractionHandler: function (evtType, handler) {
                return document.documentElement.removeEventListener(evtType, handler, applyPassive$1());
            },
            deregisterInteractionHandler: function (evtType, handler) {
                return instance.root
                    .removeEventListener(evtType, handler, applyPassive$1());
            },
            deregisterResizeHandler: function (handler) {
                return window.removeEventListener('resize', handler);
            },
            getWindowPageOffset: function () {
                return ({ x: window.pageXOffset, y: window.pageYOffset });
            },
            isSurfaceActive: function () { return matches$1(instance.root, ':active'); },
            isSurfaceDisabled: function () { return Boolean(instance.disabled); },
            isUnbounded: function () { return Boolean(instance.unbounded); },
            registerDocumentInteractionHandler: function (evtType, handler) {
                return document.documentElement.addEventListener(evtType, handler, applyPassive$1());
            },
            registerInteractionHandler: function (evtType, handler) {
                return instance.root
                    .addEventListener(evtType, handler, applyPassive$1());
            },
            registerResizeHandler: function (handler) {
                return window.addEventListener('resize', handler);
            },
            removeClass: function (className) { return instance.root.classList.remove(className); },
            updateCssVariable: function (varName, value) {
                return instance.root.style.setProperty(varName, value);
            },
        };
    };
    Object.defineProperty(MDCRipple.prototype, "unbounded", {
        get: function () {
            return Boolean(this.isUnbounded);
        },
        set: function (unbounded) {
            this.isUnbounded = Boolean(unbounded);
            this.setUnbounded();
        },
        enumerable: false,
        configurable: true
    });
    MDCRipple.prototype.activate = function () {
        this.foundation.activate();
    };
    MDCRipple.prototype.deactivate = function () {
        this.foundation.deactivate();
    };
    MDCRipple.prototype.layout = function () {
        this.foundation.layout();
    };
    MDCRipple.prototype.getDefaultFoundation = function () {
        return new MDCRippleFoundation(MDCRipple.createAdapter(this));
    };
    MDCRipple.prototype.initialSyncWithDOM = function () {
        var root = this.root;
        this.isUnbounded = 'mdcRippleIsUnbounded' in root.dataset;
    };
    /**
     * Closure Compiler throws an access control error when directly accessing a
     * protected or private property inside a getter/setter, like unbounded above.
     * By accessing the protected property inside a method, we solve that problem.
     * That's why this function exists.
     */
    MDCRipple.prototype.setUnbounded = function () {
        this.foundation.setUnbounded(Boolean(this.isUnbounded));
    };
    return MDCRipple;
}(MDCComponent));

/**
 * @license
 * Copyright 2018 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var cssClasses = {
    ICON_BUTTON_ON: 'mdc-icon-button--on',
    ROOT: 'mdc-icon-button',
};
var strings$1 = {
    ARIA_LABEL: 'aria-label',
    ARIA_PRESSED: 'aria-pressed',
    DATA_ARIA_LABEL_OFF: 'data-aria-label-off',
    DATA_ARIA_LABEL_ON: 'data-aria-label-on',
    CHANGE_EVENT: 'MDCIconButtonToggle:change',
};

/**
 * @license
 * Copyright 2018 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var MDCIconButtonToggleFoundation = /** @class */ (function (_super) {
    __extends(MDCIconButtonToggleFoundation, _super);
    function MDCIconButtonToggleFoundation(adapter) {
        var _this = _super.call(this, __assign(__assign({}, MDCIconButtonToggleFoundation.defaultAdapter), adapter)) || this;
        /**
         * Whether the icon button has an aria label that changes depending on
         * toggled state.
         */
        _this.hasToggledAriaLabel = false;
        return _this;
    }
    Object.defineProperty(MDCIconButtonToggleFoundation, "cssClasses", {
        get: function () {
            return cssClasses;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MDCIconButtonToggleFoundation, "strings", {
        get: function () {
            return strings$1;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MDCIconButtonToggleFoundation, "defaultAdapter", {
        get: function () {
            return {
                addClass: function () { return undefined; },
                hasClass: function () { return false; },
                notifyChange: function () { return undefined; },
                removeClass: function () { return undefined; },
                getAttr: function () { return null; },
                setAttr: function () { return undefined; },
            };
        },
        enumerable: false,
        configurable: true
    });
    MDCIconButtonToggleFoundation.prototype.init = function () {
        var ariaLabelOn = this.adapter.getAttr(strings$1.DATA_ARIA_LABEL_ON);
        var ariaLabelOff = this.adapter.getAttr(strings$1.DATA_ARIA_LABEL_OFF);
        if (ariaLabelOn && ariaLabelOff) {
            if (this.adapter.getAttr(strings$1.ARIA_PRESSED) !== null) {
                throw new Error('MDCIconButtonToggleFoundation: Button should not set ' +
                    '`aria-pressed` if it has a toggled aria label.');
            }
            this.hasToggledAriaLabel = true;
        }
        else {
            this.adapter.setAttr(strings$1.ARIA_PRESSED, String(this.isOn()));
        }
    };
    MDCIconButtonToggleFoundation.prototype.handleClick = function () {
        this.toggle();
        this.adapter.notifyChange({ isOn: this.isOn() });
    };
    MDCIconButtonToggleFoundation.prototype.isOn = function () {
        return this.adapter.hasClass(cssClasses.ICON_BUTTON_ON);
    };
    MDCIconButtonToggleFoundation.prototype.toggle = function (isOn) {
        if (isOn === void 0) { isOn = !this.isOn(); }
        // Toggle UI based on state.
        if (isOn) {
            this.adapter.addClass(cssClasses.ICON_BUTTON_ON);
        }
        else {
            this.adapter.removeClass(cssClasses.ICON_BUTTON_ON);
        }
        // Toggle aria attributes based on state.
        if (this.hasToggledAriaLabel) {
            var ariaLabel = isOn ?
                this.adapter.getAttr(strings$1.DATA_ARIA_LABEL_ON) :
                this.adapter.getAttr(strings$1.DATA_ARIA_LABEL_OFF);
            this.adapter.setAttr(strings$1.ARIA_LABEL, ariaLabel || '');
        }
        else {
            this.adapter.setAttr(strings$1.ARIA_PRESSED, "" + isOn);
        }
    };
    return MDCIconButtonToggleFoundation;
}(MDCFoundation));

/**
 * @license
 * Copyright 2018 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
var strings = MDCIconButtonToggleFoundation.strings;
/** @class */ ((function (_super) {
    __extends(MDCIconButtonToggle, _super);
    function MDCIconButtonToggle() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.rippleComponent = _this.createRipple();
        return _this;
    }
    MDCIconButtonToggle.attachTo = function (root) {
        return new MDCIconButtonToggle(root);
    };
    MDCIconButtonToggle.prototype.initialSyncWithDOM = function () {
        var _this = this;
        this.handleClick = function () {
            _this.foundation.handleClick();
        };
        this.listen('click', this.handleClick);
    };
    MDCIconButtonToggle.prototype.destroy = function () {
        this.unlisten('click', this.handleClick);
        this.ripple.destroy();
        _super.prototype.destroy.call(this);
    };
    MDCIconButtonToggle.prototype.getDefaultFoundation = function () {
        var _this = this;
        // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
        // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
        var adapter = {
            addClass: function (className) { return _this.root.classList.add(className); },
            hasClass: function (className) { return _this.root.classList.contains(className); },
            notifyChange: function (evtData) {
                _this.emit(strings.CHANGE_EVENT, evtData);
            },
            removeClass: function (className) { return _this.root.classList.remove(className); },
            getAttr: function (attrName) { return _this.root.getAttribute(attrName); },
            setAttr: function (attrName, attrValue) {
                return _this.root.setAttribute(attrName, attrValue);
            },
        };
        return new MDCIconButtonToggleFoundation(adapter);
    };
    Object.defineProperty(MDCIconButtonToggle.prototype, "ripple", {
        get: function () {
            return this.rippleComponent;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MDCIconButtonToggle.prototype, "on", {
        get: function () {
            return this.foundation.isOn();
        },
        set: function (isOn) {
            this.foundation.toggle(isOn);
        },
        enumerable: false,
        configurable: true
    });
    MDCIconButtonToggle.prototype.createRipple = function () {
        var ripple = new MDCRipple(this.root);
        ripple.unbounded = true;
        return ripple;
    };
    return MDCIconButtonToggle;
})(MDCComponent));

/**
 * @license
 * Copyright 2020 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
/**
 * KEY provides normalized string values for keys.
 */
var KEY = {
    UNKNOWN: 'Unknown',
    BACKSPACE: 'Backspace',
    ENTER: 'Enter',
    SPACEBAR: 'Spacebar',
    PAGE_UP: 'PageUp',
    PAGE_DOWN: 'PageDown',
    END: 'End',
    HOME: 'Home',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_UP: 'ArrowUp',
    ARROW_RIGHT: 'ArrowRight',
    ARROW_DOWN: 'ArrowDown',
    DELETE: 'Delete',
    ESCAPE: 'Escape',
    TAB: 'Tab',
};
var normalizedKeys = new Set();
// IE11 has no support for new Map with iterable so we need to initialize this
// by hand.
normalizedKeys.add(KEY.BACKSPACE);
normalizedKeys.add(KEY.ENTER);
normalizedKeys.add(KEY.SPACEBAR);
normalizedKeys.add(KEY.PAGE_UP);
normalizedKeys.add(KEY.PAGE_DOWN);
normalizedKeys.add(KEY.END);
normalizedKeys.add(KEY.HOME);
normalizedKeys.add(KEY.ARROW_LEFT);
normalizedKeys.add(KEY.ARROW_UP);
normalizedKeys.add(KEY.ARROW_RIGHT);
normalizedKeys.add(KEY.ARROW_DOWN);
normalizedKeys.add(KEY.DELETE);
normalizedKeys.add(KEY.ESCAPE);
normalizedKeys.add(KEY.TAB);
var KEY_CODE = {
    BACKSPACE: 8,
    ENTER: 13,
    SPACEBAR: 32,
    PAGE_UP: 33,
    PAGE_DOWN: 34,
    END: 35,
    HOME: 36,
    ARROW_LEFT: 37,
    ARROW_UP: 38,
    ARROW_RIGHT: 39,
    ARROW_DOWN: 40,
    DELETE: 46,
    ESCAPE: 27,
    TAB: 9,
};
var mappedKeyCodes = new Map();
// IE11 has no support for new Map with iterable so we need to initialize this
// by hand.
mappedKeyCodes.set(KEY_CODE.BACKSPACE, KEY.BACKSPACE);
mappedKeyCodes.set(KEY_CODE.ENTER, KEY.ENTER);
mappedKeyCodes.set(KEY_CODE.SPACEBAR, KEY.SPACEBAR);
mappedKeyCodes.set(KEY_CODE.PAGE_UP, KEY.PAGE_UP);
mappedKeyCodes.set(KEY_CODE.PAGE_DOWN, KEY.PAGE_DOWN);
mappedKeyCodes.set(KEY_CODE.END, KEY.END);
mappedKeyCodes.set(KEY_CODE.HOME, KEY.HOME);
mappedKeyCodes.set(KEY_CODE.ARROW_LEFT, KEY.ARROW_LEFT);
mappedKeyCodes.set(KEY_CODE.ARROW_UP, KEY.ARROW_UP);
mappedKeyCodes.set(KEY_CODE.ARROW_RIGHT, KEY.ARROW_RIGHT);
mappedKeyCodes.set(KEY_CODE.ARROW_DOWN, KEY.ARROW_DOWN);
mappedKeyCodes.set(KEY_CODE.DELETE, KEY.DELETE);
mappedKeyCodes.set(KEY_CODE.ESCAPE, KEY.ESCAPE);
mappedKeyCodes.set(KEY_CODE.TAB, KEY.TAB);
var navigationKeys = new Set();
// IE11 has no support for new Set with iterable so we need to initialize this
// by hand.
navigationKeys.add(KEY.PAGE_UP);
navigationKeys.add(KEY.PAGE_DOWN);
navigationKeys.add(KEY.END);
navigationKeys.add(KEY.HOME);
navigationKeys.add(KEY.ARROW_LEFT);
navigationKeys.add(KEY.ARROW_UP);
navigationKeys.add(KEY.ARROW_RIGHT);
navigationKeys.add(KEY.ARROW_DOWN);

const { applyPassive } = events;
const { matches } = ponyfill;
function Ripple(node, { ripple = true, surface = false, unbounded = false, disabled = false, color, active, rippleElement, eventTarget, activeTarget, addClass = (className) => node.classList.add(className), removeClass = (className) => node.classList.remove(className), addStyle = (name, value) => node.style.setProperty(name, value), initPromise = Promise.resolve(), } = {}) {
    let instance;
    let addLayoutListener = getContext('SMUI:addLayoutListener');
    let removeLayoutListener;
    let oldActive = active;
    let oldEventTarget = eventTarget;
    let oldActiveTarget = activeTarget;
    function handleProps() {
        if (surface) {
            addClass('mdc-ripple-surface');
            if (color === 'primary') {
                addClass('smui-ripple-surface--primary');
                removeClass('smui-ripple-surface--secondary');
            }
            else if (color === 'secondary') {
                removeClass('smui-ripple-surface--primary');
                addClass('smui-ripple-surface--secondary');
            }
            else {
                removeClass('smui-ripple-surface--primary');
                removeClass('smui-ripple-surface--secondary');
            }
        }
        else {
            removeClass('mdc-ripple-surface');
            removeClass('smui-ripple-surface--primary');
            removeClass('smui-ripple-surface--secondary');
        }
        // Handle activation first.
        if (instance && oldActive !== active) {
            oldActive = active;
            if (active) {
                instance.activate();
            }
            else if (active === false) {
                instance.deactivate();
            }
        }
        // Then create/destroy an instance.
        if (ripple && !instance) {
            instance = new MDCRippleFoundation({
                addClass,
                browserSupportsCssVars: () => supportsCssVariables(window),
                computeBoundingRect: () => (rippleElement || node).getBoundingClientRect(),
                containsEventTarget: (target) => node.contains(target),
                deregisterDocumentInteractionHandler: (evtType, handler) => document.documentElement.removeEventListener(evtType, handler, applyPassive()),
                deregisterInteractionHandler: (evtType, handler) => (eventTarget || node).removeEventListener(evtType, handler, applyPassive()),
                deregisterResizeHandler: (handler) => window.removeEventListener('resize', handler),
                getWindowPageOffset: () => ({
                    x: window.pageXOffset,
                    y: window.pageYOffset,
                }),
                isSurfaceActive: () => active == null ? matches(activeTarget || node, ':active') : active,
                isSurfaceDisabled: () => !!disabled,
                isUnbounded: () => !!unbounded,
                registerDocumentInteractionHandler: (evtType, handler) => document.documentElement.addEventListener(evtType, handler, applyPassive()),
                registerInteractionHandler: (evtType, handler) => (eventTarget || node).addEventListener(evtType, handler, applyPassive()),
                registerResizeHandler: (handler) => window.addEventListener('resize', handler),
                removeClass,
                updateCssVariable: addStyle,
            });
            initPromise.then(() => {
                if (instance) {
                    instance.init();
                    instance.setUnbounded(unbounded);
                }
            });
        }
        else if (instance && !ripple) {
            initPromise.then(() => {
                if (instance) {
                    instance.destroy();
                    instance = undefined;
                }
            });
        }
        // Now handle event/active targets
        if (instance &&
            (oldEventTarget !== eventTarget || oldActiveTarget !== activeTarget)) {
            oldEventTarget = eventTarget;
            oldActiveTarget = activeTarget;
            instance.destroy();
            requestAnimationFrame(() => {
                if (instance) {
                    instance.init();
                    instance.setUnbounded(unbounded);
                }
            });
        }
        if (!ripple && unbounded) {
            addClass('mdc-ripple-upgraded--unbounded');
        }
    }
    handleProps();
    if (addLayoutListener) {
        removeLayoutListener = addLayoutListener(layout);
    }
    function layout() {
        if (instance) {
            instance.layout();
        }
    }
    return {
        update(props) {
            ({
                ripple,
                surface,
                unbounded,
                disabled,
                color,
                active,
                rippleElement,
                eventTarget,
                activeTarget,
                addClass,
                removeClass,
                addStyle,
                initPromise,
            } = Object.assign({ ripple: true, surface: false, unbounded: false, disabled: false, color: undefined, active: undefined, rippleElement: undefined, eventTarget: undefined, activeTarget: undefined, addClass: (className) => node.classList.add(className), removeClass: (className) => node.classList.remove(className), addStyle: (name, value) => node.style.setProperty(name, value), initPromise: Promise.resolve() }, props));
            handleProps();
        },
        destroy() {
            if (instance) {
                instance.destroy();
                instance = undefined;
                removeClass('mdc-ripple-surface');
                removeClass('smui-ripple-surface--primary');
                removeClass('smui-ripple-surface--secondary');
            }
            if (removeLayoutListener) {
                removeLayoutListener();
            }
        },
    };
}

/* node_modules/@smui/icon-button/dist/IconButton.svelte generated by Svelte v3.49.0 */

function create_if_block$1(ctx) {
	let div;

	return {
		c() {
			div = element("div");
			attr(div, "class", "mdc-icon-button__touch");
		},
		m(target, anchor) {
			insert(target, div, anchor);
		},
		d(detaching) {
			if (detaching) detach(div);
		}
	};
}

// (1:0) <svelte:component   this={component}   bind:this={element}   use={[     [       Ripple,       {         ripple,         unbounded: true,         color,         disabled: !!$$restProps.disabled,         addClass,         removeClass,         addStyle,       },     ],     forwardEvents,     ...use,   ]}   class={classMap({     [className]: true,     'mdc-icon-button': true,     'mdc-icon-button--on': !isUninitializedValue(pressed) && pressed,     'mdc-icon-button--touch': touch,     'mdc-icon-button--display-flex': displayFlex,     'smui-icon-button--size-button': size === 'button',     'mdc-icon-button--reduced-size': size === 'mini' || size === 'button',     'mdc-card__action': context === 'card:action',     'mdc-card__action--icon': context === 'card:action',     'mdc-top-app-bar__navigation-icon': context === 'top-app-bar:navigation',     'mdc-top-app-bar__action-item': context === 'top-app-bar:action',     'mdc-snackbar__dismiss': context === 'snackbar:actions',     'mdc-data-table__pagination-button': context === 'data-table:pagination',     'mdc-data-table__sort-icon-button':       context === 'data-table:sortable-header-cell',     'mdc-dialog__close': context === 'dialog:header' && action === 'close',     ...internalClasses,   })}   style={Object.entries(internalStyles)     .map(([name, value]) => `${name}: ${value};`)     .concat([style])     .join(' ')}   aria-pressed={!isUninitializedValue(pressed)     ? pressed       ? 'true'       : 'false'     : null}   aria-label={pressed ? ariaLabelOn : ariaLabelOff}   data-aria-label-on={ariaLabelOn}   data-aria-label-off={ariaLabelOff}   aria-describedby={ariaDescribedby}   on:click={() => instance && instance.handleClick()}   on:click={() =>     context === 'top-app-bar:navigation' &&     dispatch(getElement(), 'SMUITopAppBarIconButton:nav')}   {href}   {...actionProp}   {...internalAttrs}   {...$$restProps}   >
function create_default_slot$2(ctx) {
	let div;
	let t;
	let if_block_anchor;
	let current;
	const default_slot_template = /*#slots*/ ctx[32].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[36], null);
	let if_block = /*touch*/ ctx[8] && create_if_block$1();

	return {
		c() {
			div = element("div");
			t = space();
			if (default_slot) default_slot.c();
			if (if_block) if_block.c();
			if_block_anchor = empty();
			attr(div, "class", "mdc-icon-button__ripple");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			insert(target, t, anchor);

			if (default_slot) {
				default_slot.m(target, anchor);
			}

			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			if (default_slot) {
				if (default_slot.p && (!current || dirty[1] & /*$$scope*/ 32)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[36],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[36])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[36], dirty, null),
						null
					);
				}
			}

			if (/*touch*/ ctx[8]) {
				if (if_block) ; else {
					if_block = create_if_block$1();
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			if (detaching) detach(t);
			if (default_slot) default_slot.d(detaching);
			if (if_block) if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

function create_fragment$2(ctx) {
	let switch_instance;
	let switch_instance_anchor;
	let current;

	const switch_instance_spread_levels = [
		{
			use: [
				[
					Ripple,
					{
						ripple: /*ripple*/ ctx[4],
						unbounded: true,
						color: /*color*/ ctx[5],
						disabled: !!/*$$restProps*/ ctx[28].disabled,
						addClass: /*addClass*/ ctx[25],
						removeClass: /*removeClass*/ ctx[26],
						addStyle: /*addStyle*/ ctx[27]
					}
				],
				/*forwardEvents*/ ctx[21],
				.../*use*/ ctx[1]
			]
		},
		{
			class: classMap({
				[/*className*/ ctx[2]]: true,
				'mdc-icon-button': true,
				'mdc-icon-button--on': !/*isUninitializedValue*/ ctx[22](/*pressed*/ ctx[0]) && /*pressed*/ ctx[0],
				'mdc-icon-button--touch': /*touch*/ ctx[8],
				'mdc-icon-button--display-flex': /*displayFlex*/ ctx[9],
				'smui-icon-button--size-button': /*size*/ ctx[10] === 'button',
				'mdc-icon-button--reduced-size': /*size*/ ctx[10] === 'mini' || /*size*/ ctx[10] === 'button',
				'mdc-card__action': /*context*/ ctx[23] === 'card:action',
				'mdc-card__action--icon': /*context*/ ctx[23] === 'card:action',
				'mdc-top-app-bar__navigation-icon': /*context*/ ctx[23] === 'top-app-bar:navigation',
				'mdc-top-app-bar__action-item': /*context*/ ctx[23] === 'top-app-bar:action',
				'mdc-snackbar__dismiss': /*context*/ ctx[23] === 'snackbar:actions',
				'mdc-data-table__pagination-button': /*context*/ ctx[23] === 'data-table:pagination',
				'mdc-data-table__sort-icon-button': /*context*/ ctx[23] === 'data-table:sortable-header-cell',
				'mdc-dialog__close': /*context*/ ctx[23] === 'dialog:header' && /*action*/ ctx[12] === 'close',
				.../*internalClasses*/ ctx[17]
			})
		},
		{
			style: Object.entries(/*internalStyles*/ ctx[18]).map(func).concat([/*style*/ ctx[3]]).join(' ')
		},
		{
			"aria-pressed": !/*isUninitializedValue*/ ctx[22](/*pressed*/ ctx[0])
			? /*pressed*/ ctx[0] ? 'true' : 'false'
			: null
		},
		{
			"aria-label": /*pressed*/ ctx[0]
			? /*ariaLabelOn*/ ctx[6]
			: /*ariaLabelOff*/ ctx[7]
		},
		{
			"data-aria-label-on": /*ariaLabelOn*/ ctx[6]
		},
		{
			"data-aria-label-off": /*ariaLabelOff*/ ctx[7]
		},
		{
			"aria-describedby": /*ariaDescribedby*/ ctx[24]
		},
		{ href: /*href*/ ctx[11] },
		/*actionProp*/ ctx[20],
		/*internalAttrs*/ ctx[19],
		/*$$restProps*/ ctx[28]
	];

	var switch_value = /*component*/ ctx[13];

	function switch_props(ctx) {
		let switch_instance_props = {
			$$slots: { default: [create_default_slot$2] },
			$$scope: { ctx }
		};

		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
		}

		return { props: switch_instance_props };
	}

	if (switch_value) {
		switch_instance = new switch_value(switch_props(ctx));
		/*switch_instance_binding*/ ctx[33](switch_instance);
		switch_instance.$on("click", /*click_handler*/ ctx[34]);
		switch_instance.$on("click", /*click_handler_1*/ ctx[35]);
	}

	return {
		c() {
			if (switch_instance) create_component(switch_instance.$$.fragment);
			switch_instance_anchor = empty();
		},
		m(target, anchor) {
			if (switch_instance) {
				mount_component(switch_instance, target, anchor);
			}

			insert(target, switch_instance_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const switch_instance_changes = (dirty[0] & /*ripple, color, $$restProps, addClass, removeClass, addStyle, forwardEvents, use, className, isUninitializedValue, pressed, touch, displayFlex, size, context, action, internalClasses, internalStyles, style, ariaLabelOn, ariaLabelOff, ariaDescribedby, href, actionProp, internalAttrs*/ 536748031)
			? get_spread_update(switch_instance_spread_levels, [
					dirty[0] & /*ripple, color, $$restProps, addClass, removeClass, addStyle, forwardEvents, use*/ 505413682 && {
						use: [
							[
								Ripple,
								{
									ripple: /*ripple*/ ctx[4],
									unbounded: true,
									color: /*color*/ ctx[5],
									disabled: !!/*$$restProps*/ ctx[28].disabled,
									addClass: /*addClass*/ ctx[25],
									removeClass: /*removeClass*/ ctx[26],
									addStyle: /*addStyle*/ ctx[27]
								}
							],
							/*forwardEvents*/ ctx[21],
							.../*use*/ ctx[1]
						]
					},
					dirty[0] & /*className, isUninitializedValue, pressed, touch, displayFlex, size, context, action, internalClasses*/ 12719877 && {
						class: classMap({
							[/*className*/ ctx[2]]: true,
							'mdc-icon-button': true,
							'mdc-icon-button--on': !/*isUninitializedValue*/ ctx[22](/*pressed*/ ctx[0]) && /*pressed*/ ctx[0],
							'mdc-icon-button--touch': /*touch*/ ctx[8],
							'mdc-icon-button--display-flex': /*displayFlex*/ ctx[9],
							'smui-icon-button--size-button': /*size*/ ctx[10] === 'button',
							'mdc-icon-button--reduced-size': /*size*/ ctx[10] === 'mini' || /*size*/ ctx[10] === 'button',
							'mdc-card__action': /*context*/ ctx[23] === 'card:action',
							'mdc-card__action--icon': /*context*/ ctx[23] === 'card:action',
							'mdc-top-app-bar__navigation-icon': /*context*/ ctx[23] === 'top-app-bar:navigation',
							'mdc-top-app-bar__action-item': /*context*/ ctx[23] === 'top-app-bar:action',
							'mdc-snackbar__dismiss': /*context*/ ctx[23] === 'snackbar:actions',
							'mdc-data-table__pagination-button': /*context*/ ctx[23] === 'data-table:pagination',
							'mdc-data-table__sort-icon-button': /*context*/ ctx[23] === 'data-table:sortable-header-cell',
							'mdc-dialog__close': /*context*/ ctx[23] === 'dialog:header' && /*action*/ ctx[12] === 'close',
							.../*internalClasses*/ ctx[17]
						})
					},
					dirty[0] & /*internalStyles, style*/ 262152 && {
						style: Object.entries(/*internalStyles*/ ctx[18]).map(func).concat([/*style*/ ctx[3]]).join(' ')
					},
					dirty[0] & /*isUninitializedValue, pressed*/ 4194305 && {
						"aria-pressed": !/*isUninitializedValue*/ ctx[22](/*pressed*/ ctx[0])
						? /*pressed*/ ctx[0] ? 'true' : 'false'
						: null
					},
					dirty[0] & /*pressed, ariaLabelOn, ariaLabelOff*/ 193 && {
						"aria-label": /*pressed*/ ctx[0]
						? /*ariaLabelOn*/ ctx[6]
						: /*ariaLabelOff*/ ctx[7]
					},
					dirty[0] & /*ariaLabelOn*/ 64 && {
						"data-aria-label-on": /*ariaLabelOn*/ ctx[6]
					},
					dirty[0] & /*ariaLabelOff*/ 128 && {
						"data-aria-label-off": /*ariaLabelOff*/ ctx[7]
					},
					dirty[0] & /*ariaDescribedby*/ 16777216 && {
						"aria-describedby": /*ariaDescribedby*/ ctx[24]
					},
					dirty[0] & /*href*/ 2048 && { href: /*href*/ ctx[11] },
					dirty[0] & /*actionProp*/ 1048576 && get_spread_object(/*actionProp*/ ctx[20]),
					dirty[0] & /*internalAttrs*/ 524288 && get_spread_object(/*internalAttrs*/ ctx[19]),
					dirty[0] & /*$$restProps*/ 268435456 && get_spread_object(/*$$restProps*/ ctx[28])
				])
			: {};

			if (dirty[0] & /*touch*/ 256 | dirty[1] & /*$$scope*/ 32) {
				switch_instance_changes.$$scope = { dirty, ctx };
			}

			if (switch_value !== (switch_value = /*component*/ ctx[13])) {
				if (switch_instance) {
					group_outros();
					const old_component = switch_instance;

					transition_out(old_component.$$.fragment, 1, 0, () => {
						destroy_component(old_component, 1);
					});

					check_outros();
				}

				if (switch_value) {
					switch_instance = new switch_value(switch_props(ctx));
					/*switch_instance_binding*/ ctx[33](switch_instance);
					switch_instance.$on("click", /*click_handler*/ ctx[34]);
					switch_instance.$on("click", /*click_handler_1*/ ctx[35]);
					create_component(switch_instance.$$.fragment);
					transition_in(switch_instance.$$.fragment, 1);
					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
				} else {
					switch_instance = null;
				}
			} else if (switch_value) {
				switch_instance.$set(switch_instance_changes);
			}
		},
		i(local) {
			if (current) return;
			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
			current = true;
		},
		o(local) {
			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			/*switch_instance_binding*/ ctx[33](null);
			if (detaching) detach(switch_instance_anchor);
			if (switch_instance) destroy_component(switch_instance, detaching);
		}
	};
}

const func = ([name, value]) => `${name}: ${value};`;

function instance_1($$self, $$props, $$invalidate) {
	let actionProp;

	const omit_props_names = [
		"use","class","style","ripple","color","toggle","pressed","ariaLabelOn","ariaLabelOff","touch","displayFlex","size","href","action","component","getElement"
	];

	let $$restProps = compute_rest_props($$props, omit_props_names);
	let { $$slots: slots = {}, $$scope } = $$props;
	const forwardEvents = forwardEventsBuilder(get_current_component());

	let uninitializedValue = () => {
		
	};

	function isUninitializedValue(value) {
		return value === uninitializedValue;
	}

	let { use = [] } = $$props;
	let { class: className = '' } = $$props;
	let { style = '' } = $$props;
	let { ripple = true } = $$props;
	let { color = undefined } = $$props;
	let { toggle = false } = $$props;
	let { pressed = uninitializedValue } = $$props;
	let { ariaLabelOn = undefined } = $$props;
	let { ariaLabelOff = undefined } = $$props;
	let { touch = false } = $$props;
	let { displayFlex = true } = $$props;
	let { size = 'normal' } = $$props;
	let { href = undefined } = $$props;
	let { action = undefined } = $$props;
	let element;
	let instance;
	let internalClasses = {};
	let internalStyles = {};
	let internalAttrs = {};
	let context = getContext('SMUI:icon-button:context');
	let ariaDescribedby = getContext('SMUI:icon-button:aria-describedby');
	let { component = href == null ? Button : A } = $$props;
	let previousDisabled = $$restProps.disabled;
	setContext('SMUI:icon:context', 'icon-button');
	let oldToggle = null;

	onDestroy(() => {
		instance && instance.destroy();
	});

	function hasClass(className) {
		return className in internalClasses
		? internalClasses[className]
		: getElement().classList.contains(className);
	}

	function addClass(className) {
		if (!internalClasses[className]) {
			$$invalidate(17, internalClasses[className] = true, internalClasses);
		}
	}

	function removeClass(className) {
		if (!(className in internalClasses) || internalClasses[className]) {
			$$invalidate(17, internalClasses[className] = false, internalClasses);
		}
	}

	function addStyle(name, value) {
		if (internalStyles[name] != value) {
			if (value === '' || value == null) {
				delete internalStyles[name];
				$$invalidate(18, internalStyles);
			} else {
				$$invalidate(18, internalStyles[name] = value, internalStyles);
			}
		}
	}

	function getAttr(name) {
		var _a;

		return name in internalAttrs
		? (_a = internalAttrs[name]) !== null && _a !== void 0
			? _a
			: null
		: getElement().getAttribute(name);
	}

	function addAttr(name, value) {
		if (internalAttrs[name] !== value) {
			$$invalidate(19, internalAttrs[name] = value, internalAttrs);
		}
	}

	function handleChange(evtData) {
		$$invalidate(0, pressed = evtData.isOn);
	}

	function getElement() {
		return element.getElement();
	}

	function switch_instance_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			element = $$value;
			$$invalidate(15, element);
		});
	}

	const click_handler = () => instance && instance.handleClick();
	const click_handler_1 = () => context === 'top-app-bar:navigation' && dispatch(getElement(), 'SMUITopAppBarIconButton:nav');

	$$self.$$set = $$new_props => {
		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
		$$invalidate(28, $$restProps = compute_rest_props($$props, omit_props_names));
		if ('use' in $$new_props) $$invalidate(1, use = $$new_props.use);
		if ('class' in $$new_props) $$invalidate(2, className = $$new_props.class);
		if ('style' in $$new_props) $$invalidate(3, style = $$new_props.style);
		if ('ripple' in $$new_props) $$invalidate(4, ripple = $$new_props.ripple);
		if ('color' in $$new_props) $$invalidate(5, color = $$new_props.color);
		if ('toggle' in $$new_props) $$invalidate(29, toggle = $$new_props.toggle);
		if ('pressed' in $$new_props) $$invalidate(0, pressed = $$new_props.pressed);
		if ('ariaLabelOn' in $$new_props) $$invalidate(6, ariaLabelOn = $$new_props.ariaLabelOn);
		if ('ariaLabelOff' in $$new_props) $$invalidate(7, ariaLabelOff = $$new_props.ariaLabelOff);
		if ('touch' in $$new_props) $$invalidate(8, touch = $$new_props.touch);
		if ('displayFlex' in $$new_props) $$invalidate(9, displayFlex = $$new_props.displayFlex);
		if ('size' in $$new_props) $$invalidate(10, size = $$new_props.size);
		if ('href' in $$new_props) $$invalidate(11, href = $$new_props.href);
		if ('action' in $$new_props) $$invalidate(12, action = $$new_props.action);
		if ('component' in $$new_props) $$invalidate(13, component = $$new_props.component);
		if ('$$scope' in $$new_props) $$invalidate(36, $$scope = $$new_props.$$scope);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty[0] & /*action*/ 4096) {
			$$invalidate(20, actionProp = (() => {
				if (context === 'data-table:pagination') {
					switch (action) {
						case 'first-page':
							return { 'data-first-page': 'true' };
						case 'prev-page':
							return { 'data-prev-page': 'true' };
						case 'next-page':
							return { 'data-next-page': 'true' };
						case 'last-page':
							return { 'data-last-page': 'true' };
						default:
							return { 'data-action': 'true' };
					}
				} else if (context === 'dialog:header') {
					return { 'data-mdc-dialog-action': action };
				} else {
					return { action };
				}
			})());
		}

		if (previousDisabled !== $$restProps.disabled) {
			const elem = getElement();

			if ('blur' in elem) {
				elem.blur();
			}

			$$invalidate(30, previousDisabled = $$restProps.disabled);
		}

		if ($$self.$$.dirty[0] & /*element, toggle, instance*/ 536969216 | $$self.$$.dirty[1] & /*oldToggle*/ 1) {
			if (element && getElement() && toggle !== oldToggle) {
				if (toggle && !instance) {
					$$invalidate(16, instance = new MDCIconButtonToggleFoundation({
							addClass,
							hasClass,
							notifyChange: evtData => {
								handleChange(evtData);
								dispatch(getElement(), 'SMUIIconButtonToggle:change', evtData, undefined, true);
							},
							removeClass,
							getAttr,
							setAttr: addAttr
						}));

					instance.init();
				} else if (!toggle && instance) {
					instance.destroy();
					$$invalidate(16, instance = undefined);
					$$invalidate(17, internalClasses = {});
					$$invalidate(19, internalAttrs = {});
				}

				$$invalidate(31, oldToggle = toggle);
			}
		}

		if ($$self.$$.dirty[0] & /*instance, pressed*/ 65537) {
			if (instance && !isUninitializedValue(pressed) && instance.isOn() !== pressed) {
				instance.toggle(pressed);
			}
		}
	};

	return [
		pressed,
		use,
		className,
		style,
		ripple,
		color,
		ariaLabelOn,
		ariaLabelOff,
		touch,
		displayFlex,
		size,
		href,
		action,
		component,
		getElement,
		element,
		instance,
		internalClasses,
		internalStyles,
		internalAttrs,
		actionProp,
		forwardEvents,
		isUninitializedValue,
		context,
		ariaDescribedby,
		addClass,
		removeClass,
		addStyle,
		$$restProps,
		toggle,
		previousDisabled,
		oldToggle,
		slots,
		switch_instance_binding,
		click_handler,
		click_handler_1,
		$$scope
	];
}

class IconButton extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance_1,
			create_fragment$2,
			safe_not_equal,
			{
				use: 1,
				class: 2,
				style: 3,
				ripple: 4,
				color: 5,
				toggle: 29,
				pressed: 0,
				ariaLabelOn: 6,
				ariaLabelOff: 7,
				touch: 8,
				displayFlex: 9,
				size: 10,
				href: 11,
				action: 12,
				component: 13,
				getElement: 14
			},
			null,
			[-1, -1]
		);
	}

	get getElement() {
		return this.$$.ctx[14];
	}
}

/* node_modules/@smui/common/dist/CommonIcon.svelte generated by Svelte v3.49.0 */

function create_default_slot$1(ctx) {
	let current;
	const default_slot_template = /*#slots*/ ctx[9].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[11], null);

	return {
		c() {
			if (default_slot) default_slot.c();
		},
		m(target, anchor) {
			if (default_slot) {
				default_slot.m(target, anchor);
			}

			current = true;
		},
		p(ctx, dirty) {
			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 2048)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[11],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[11])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[11], dirty, null),
						null
					);
				}
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function create_fragment$1(ctx) {
	let switch_instance;
	let switch_instance_anchor;
	let current;

	const switch_instance_spread_levels = [
		{
			use: [/*forwardEvents*/ ctx[5], .../*use*/ ctx[0]]
		},
		{
			class: classMap({
				[/*className*/ ctx[1]]: true,
				'mdc-button__icon': /*context*/ ctx[6] === 'button',
				'mdc-fab__icon': /*context*/ ctx[6] === 'fab',
				'mdc-icon-button__icon': /*context*/ ctx[6] === 'icon-button',
				'mdc-icon-button__icon--on': /*context*/ ctx[6] === 'icon-button' && /*on*/ ctx[2],
				'mdc-tab__icon': /*context*/ ctx[6] === 'tab',
				'mdc-banner__icon': /*context*/ ctx[6] === 'banner',
				'mdc-segmented-button__icon': /*context*/ ctx[6] === 'segmented-button'
			})
		},
		{ "aria-hidden": "true" },
		/*component*/ ctx[3] === Svg$1
		? { focusable: 'false', tabindex: '-1' }
		: {},
		/*$$restProps*/ ctx[7]
	];

	var switch_value = /*component*/ ctx[3];

	function switch_props(ctx) {
		let switch_instance_props = {
			$$slots: { default: [create_default_slot$1] },
			$$scope: { ctx }
		};

		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
		}

		return { props: switch_instance_props };
	}

	if (switch_value) {
		switch_instance = new switch_value(switch_props(ctx));
		/*switch_instance_binding*/ ctx[10](switch_instance);
	}

	return {
		c() {
			if (switch_instance) create_component(switch_instance.$$.fragment);
			switch_instance_anchor = empty();
		},
		m(target, anchor) {
			if (switch_instance) {
				mount_component(switch_instance, target, anchor);
			}

			insert(target, switch_instance_anchor, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			const switch_instance_changes = (dirty & /*forwardEvents, use, classMap, className, context, on, component, Svg, $$restProps*/ 239)
			? get_spread_update(switch_instance_spread_levels, [
					dirty & /*forwardEvents, use*/ 33 && {
						use: [/*forwardEvents*/ ctx[5], .../*use*/ ctx[0]]
					},
					dirty & /*classMap, className, context, on*/ 70 && {
						class: classMap({
							[/*className*/ ctx[1]]: true,
							'mdc-button__icon': /*context*/ ctx[6] === 'button',
							'mdc-fab__icon': /*context*/ ctx[6] === 'fab',
							'mdc-icon-button__icon': /*context*/ ctx[6] === 'icon-button',
							'mdc-icon-button__icon--on': /*context*/ ctx[6] === 'icon-button' && /*on*/ ctx[2],
							'mdc-tab__icon': /*context*/ ctx[6] === 'tab',
							'mdc-banner__icon': /*context*/ ctx[6] === 'banner',
							'mdc-segmented-button__icon': /*context*/ ctx[6] === 'segmented-button'
						})
					},
					switch_instance_spread_levels[2],
					dirty & /*component, Svg*/ 8 && get_spread_object(/*component*/ ctx[3] === Svg$1
					? { focusable: 'false', tabindex: '-1' }
					: {}),
					dirty & /*$$restProps*/ 128 && get_spread_object(/*$$restProps*/ ctx[7])
				])
			: {};

			if (dirty & /*$$scope*/ 2048) {
				switch_instance_changes.$$scope = { dirty, ctx };
			}

			if (switch_value !== (switch_value = /*component*/ ctx[3])) {
				if (switch_instance) {
					group_outros();
					const old_component = switch_instance;

					transition_out(old_component.$$.fragment, 1, 0, () => {
						destroy_component(old_component, 1);
					});

					check_outros();
				}

				if (switch_value) {
					switch_instance = new switch_value(switch_props(ctx));
					/*switch_instance_binding*/ ctx[10](switch_instance);
					create_component(switch_instance.$$.fragment);
					transition_in(switch_instance.$$.fragment, 1);
					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
				} else {
					switch_instance = null;
				}
			} else if (switch_value) {
				switch_instance.$set(switch_instance_changes);
			}
		},
		i(local) {
			if (current) return;
			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
			current = true;
		},
		o(local) {
			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			/*switch_instance_binding*/ ctx[10](null);
			if (detaching) detach(switch_instance_anchor);
			if (switch_instance) destroy_component(switch_instance, detaching);
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	const omit_props_names = ["use","class","on","component","getElement"];
	let $$restProps = compute_rest_props($$props, omit_props_names);
	let { $$slots: slots = {}, $$scope } = $$props;
	const forwardEvents = forwardEventsBuilder(get_current_component());
	let { use = [] } = $$props;
	let { class: className = '' } = $$props;
	let { on = false } = $$props;
	let element;
	let { component = I } = $$props;
	const context = getContext('SMUI:icon:context');

	function getElement() {
		return element.getElement();
	}

	function switch_instance_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			element = $$value;
			$$invalidate(4, element);
		});
	}

	$$self.$$set = $$new_props => {
		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
		$$invalidate(7, $$restProps = compute_rest_props($$props, omit_props_names));
		if ('use' in $$new_props) $$invalidate(0, use = $$new_props.use);
		if ('class' in $$new_props) $$invalidate(1, className = $$new_props.class);
		if ('on' in $$new_props) $$invalidate(2, on = $$new_props.on);
		if ('component' in $$new_props) $$invalidate(3, component = $$new_props.component);
		if ('$$scope' in $$new_props) $$invalidate(11, $$scope = $$new_props.$$scope);
	};

	return [
		use,
		className,
		on,
		component,
		element,
		forwardEvents,
		context,
		$$restProps,
		getElement,
		slots,
		switch_instance_binding,
		$$scope
	];
}

class CommonIcon extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
			use: 0,
			class: 1,
			on: 2,
			component: 3,
			getElement: 8
		});
	}

	get getElement() {
		return this.$$.ctx[8];
	}
}

const Icon = CommonIcon;

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var wavesurfer = {exports: {}};

/*!
 * wavesurfer.js 6.2.0 (2022-05-16)
 * https://wavesurfer-js.org
 * @license BSD-3-Clause
 */

(function (module, exports) {
	(function webpackUniversalModuleDefinition(root, factory) {
		module.exports = factory();
	})(self, () => {
	return /******/ (() => { // webpackBootstrap
	/******/ 	var __webpack_modules__ = ({

	/***/ "./src/drawer.canvasentry.js":
	/*!***********************************!*\
	  !*** ./src/drawer.canvasentry.js ***!
	  \***********************************/
	/***/ ((module, exports, __webpack_require__) => {


	Object.defineProperty(exports, "__esModule", ({
	  value: true
	}));
	exports["default"] = void 0;

	var _style = _interopRequireDefault(__webpack_require__(/*! ./util/style */ "./src/util/style.js"));

	var _getId = _interopRequireDefault(__webpack_require__(/*! ./util/get-id */ "./src/util/get-id.js"));

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

	function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

	/**
	 * The `CanvasEntry` class represents an element consisting of a wave `canvas`
	 * and an (optional) progress wave `canvas`.
	 *
	 * The `MultiCanvas` renderer uses one or more `CanvasEntry` instances to
	 * render a waveform, depending on the zoom level.
	 */
	var CanvasEntry = /*#__PURE__*/function () {
	  function CanvasEntry() {
	    _classCallCheck(this, CanvasEntry);

	    /**
	     * The wave node
	     *
	     * @type {HTMLCanvasElement}
	     */
	    this.wave = null;
	    /**
	     * The wave canvas rendering context
	     *
	     * @type {CanvasRenderingContext2D}
	     */

	    this.waveCtx = null;
	    /**
	     * The (optional) progress wave node
	     *
	     * @type {HTMLCanvasElement}
	     */

	    this.progress = null;
	    /**
	     * The (optional) progress wave canvas rendering context
	     *
	     * @type {CanvasRenderingContext2D}
	     */

	    this.progressCtx = null;
	    /**
	     * Start of the area the canvas should render, between 0 and 1
	     *
	     * @type {number}
	     */

	    this.start = 0;
	    /**
	     * End of the area the canvas should render, between 0 and 1
	     *
	     * @type {number}
	     */

	    this.end = 1;
	    /**
	     * Unique identifier for this entry
	     *
	     * @type {string}
	     */

	    this.id = (0, _getId.default)(typeof this.constructor.name !== 'undefined' ? this.constructor.name.toLowerCase() + '_' : 'canvasentry_');
	    /**
	     * Canvas 2d context attributes
	     *
	     * @type {object}
	     */

	    this.canvasContextAttributes = {};
	  }
	  /**
	   * Store the wave canvas element and create the 2D rendering context
	   *
	   * @param {HTMLCanvasElement} element The wave `canvas` element.
	   */


	  _createClass(CanvasEntry, [{
	    key: "initWave",
	    value: function initWave(element) {
	      this.wave = element;
	      this.waveCtx = this.wave.getContext('2d', this.canvasContextAttributes);
	    }
	    /**
	     * Store the progress wave canvas element and create the 2D rendering
	     * context
	     *
	     * @param {HTMLCanvasElement} element The progress wave `canvas` element.
	     */

	  }, {
	    key: "initProgress",
	    value: function initProgress(element) {
	      this.progress = element;
	      this.progressCtx = this.progress.getContext('2d', this.canvasContextAttributes);
	    }
	    /**
	     * Update the dimensions
	     *
	     * @param {number} elementWidth Width of the entry
	     * @param {number} totalWidth Total width of the multi canvas renderer
	     * @param {number} width The new width of the element
	     * @param {number} height The new height of the element
	     */

	  }, {
	    key: "updateDimensions",
	    value: function updateDimensions(elementWidth, totalWidth, width, height) {
	      // where the canvas starts and ends in the waveform, represented as a
	      // decimal between 0 and 1
	      this.start = this.wave.offsetLeft / totalWidth || 0;
	      this.end = this.start + elementWidth / totalWidth; // set wave canvas dimensions

	      this.wave.width = width;
	      this.wave.height = height;
	      var elementSize = {
	        width: elementWidth + 'px'
	      };
	      (0, _style.default)(this.wave, elementSize);

	      if (this.hasProgressCanvas) {
	        // set progress canvas dimensions
	        this.progress.width = width;
	        this.progress.height = height;
	        (0, _style.default)(this.progress, elementSize);
	      }
	    }
	    /**
	     * Clear the wave and progress rendering contexts
	     */

	  }, {
	    key: "clearWave",
	    value: function clearWave() {
	      // wave
	      this.waveCtx.clearRect(0, 0, this.waveCtx.canvas.width, this.waveCtx.canvas.height); // progress

	      if (this.hasProgressCanvas) {
	        this.progressCtx.clearRect(0, 0, this.progressCtx.canvas.width, this.progressCtx.canvas.height);
	      }
	    }
	    /**
	     * Set the fill styles for wave and progress
	     * @param {string|string[]} waveColor Fill color for the wave canvas,
	     * or an array of colors to apply as a gradient
	     * @param {?string|string[]} progressColor Fill color for the progress canvas,
	     * or an array of colors to apply as a gradient
	     */

	  }, {
	    key: "setFillStyles",
	    value: function setFillStyles(waveColor, progressColor) {
	      this.waveCtx.fillStyle = this.getFillStyle(this.waveCtx, waveColor);

	      if (this.hasProgressCanvas) {
	        this.progressCtx.fillStyle = this.getFillStyle(this.progressCtx, progressColor);
	      }
	    }
	    /**
	     * Utility function to handle wave color arguments
	     *
	     * When the color argument type is a string or CanvasGradient instance,
	     * it will be returned as is. Otherwise, it will be treated as an array,
	     * and a new CanvasGradient will be returned
	     *
	     * @since 6.0.0
	     * @param {CanvasRenderingContext2D} ctx Rendering context of target canvas
	     * @param {string|string[]|CanvasGradient} color Either a single fill color
	     *     for the wave canvas, an existing CanvasGradient instance, or an array
	     *     of colors to apply as a gradient
	     * @returns {string|CanvasGradient} Returns a string fillstyle value, or a
	     *     canvas gradient
	     */

	  }, {
	    key: "getFillStyle",
	    value: function getFillStyle(ctx, color) {
	      if (typeof color == 'string' || color instanceof CanvasGradient) {
	        return color;
	      }

	      var waveGradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
	      color.forEach(function (value, index) {
	        return waveGradient.addColorStop(index / color.length, value);
	      });
	      return waveGradient;
	    }
	    /**
	     * Set the canvas transforms for wave and progress
	     *
	     * @param {boolean} vertical Whether to render vertically
	     */

	  }, {
	    key: "applyCanvasTransforms",
	    value: function applyCanvasTransforms(vertical) {
	      if (vertical) {
	        // Reflect the waveform across the line y = -x
	        this.waveCtx.setTransform(0, 1, 1, 0, 0, 0);

	        if (this.hasProgressCanvas) {
	          this.progressCtx.setTransform(0, 1, 1, 0, 0, 0);
	        }
	      }
	    }
	    /**
	     * Draw a rectangle for wave and progress
	     *
	     * @param {number} x X start position
	     * @param {number} y Y start position
	     * @param {number} width Width of the rectangle
	     * @param {number} height Height of the rectangle
	     * @param {number} radius Radius of the rectangle
	     */

	  }, {
	    key: "fillRects",
	    value: function fillRects(x, y, width, height, radius) {
	      this.fillRectToContext(this.waveCtx, x, y, width, height, radius);

	      if (this.hasProgressCanvas) {
	        this.fillRectToContext(this.progressCtx, x, y, width, height, radius);
	      }
	    }
	    /**
	     * Draw the actual rectangle on a `canvas` element
	     *
	     * @param {CanvasRenderingContext2D} ctx Rendering context of target canvas
	     * @param {number} x X start position
	     * @param {number} y Y start position
	     * @param {number} width Width of the rectangle
	     * @param {number} height Height of the rectangle
	     * @param {number} radius Radius of the rectangle
	     */

	  }, {
	    key: "fillRectToContext",
	    value: function fillRectToContext(ctx, x, y, width, height, radius) {
	      if (!ctx) {
	        return;
	      }

	      if (radius) {
	        this.drawRoundedRect(ctx, x, y, width, height, radius);
	      } else {
	        ctx.fillRect(x, y, width, height);
	      }
	    }
	    /**
	     * Draw a rounded rectangle on Canvas
	     *
	     * @param {CanvasRenderingContext2D} ctx Canvas context
	     * @param {number} x X-position of the rectangle
	     * @param {number} y Y-position of the rectangle
	     * @param {number} width Width of the rectangle
	     * @param {number} height Height of the rectangle
	     * @param {number} radius Radius of the rectangle
	     *
	     * @return {void}
	     * @example drawRoundedRect(ctx, 50, 50, 5, 10, 3)
	     */

	  }, {
	    key: "drawRoundedRect",
	    value: function drawRoundedRect(ctx, x, y, width, height, radius) {
	      if (height === 0) {
	        return;
	      } // peaks are float values from -1 to 1. Use absolute height values in
	      // order to correctly calculate rounded rectangle coordinates


	      if (height < 0) {
	        height *= -1;
	        y -= height;
	      }

	      ctx.beginPath();
	      ctx.moveTo(x + radius, y);
	      ctx.lineTo(x + width - radius, y);
	      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
	      ctx.lineTo(x + width, y + height - radius);
	      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
	      ctx.lineTo(x + radius, y + height);
	      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
	      ctx.lineTo(x, y + radius);
	      ctx.quadraticCurveTo(x, y, x + radius, y);
	      ctx.closePath();
	      ctx.fill();
	    }
	    /**
	     * Render the actual wave and progress lines
	     *
	     * @param {number[]} peaks Array with peaks data
	     * @param {number} absmax Maximum peak value (absolute)
	     * @param {number} halfH Half the height of the waveform
	     * @param {number} offsetY Offset to the top
	     * @param {number} start The x-offset of the beginning of the area that
	     * should be rendered
	     * @param {number} end The x-offset of the end of the area that
	     * should be rendered
	     */

	  }, {
	    key: "drawLines",
	    value: function drawLines(peaks, absmax, halfH, offsetY, start, end) {
	      this.drawLineToContext(this.waveCtx, peaks, absmax, halfH, offsetY, start, end);

	      if (this.hasProgressCanvas) {
	        this.drawLineToContext(this.progressCtx, peaks, absmax, halfH, offsetY, start, end);
	      }
	    }
	    /**
	     * Render the actual waveform line on a `canvas` element
	     *
	     * @param {CanvasRenderingContext2D} ctx Rendering context of target canvas
	     * @param {number[]} peaks Array with peaks data
	     * @param {number} absmax Maximum peak value (absolute)
	     * @param {number} halfH Half the height of the waveform
	     * @param {number} offsetY Offset to the top
	     * @param {number} start The x-offset of the beginning of the area that
	     * should be rendered
	     * @param {number} end The x-offset of the end of the area that
	     * should be rendered
	     */

	  }, {
	    key: "drawLineToContext",
	    value: function drawLineToContext(ctx, peaks, absmax, halfH, offsetY, start, end) {
	      if (!ctx) {
	        return;
	      }

	      var length = peaks.length / 2;
	      var first = Math.round(length * this.start); // use one more peak value to make sure we join peaks at ends -- unless,
	      // of course, this is the last canvas

	      var last = Math.round(length * this.end) + 1;
	      var canvasStart = first;
	      var canvasEnd = last;
	      var scale = this.wave.width / (canvasEnd - canvasStart - 1); // optimization

	      var halfOffset = halfH + offsetY;
	      var absmaxHalf = absmax / halfH;
	      ctx.beginPath();
	      ctx.moveTo((canvasStart - first) * scale, halfOffset);
	      ctx.lineTo((canvasStart - first) * scale, halfOffset - Math.round((peaks[2 * canvasStart] || 0) / absmaxHalf));
	      var i, peak, h;

	      for (i = canvasStart; i < canvasEnd; i++) {
	        peak = peaks[2 * i] || 0;
	        h = Math.round(peak / absmaxHalf);
	        ctx.lineTo((i - first) * scale + this.halfPixel, halfOffset - h);
	      } // draw the bottom edge going backwards, to make a single
	      // closed hull to fill


	      var j = canvasEnd - 1;

	      for (j; j >= canvasStart; j--) {
	        peak = peaks[2 * j + 1] || 0;
	        h = Math.round(peak / absmaxHalf);
	        ctx.lineTo((j - first) * scale + this.halfPixel, halfOffset - h);
	      }

	      ctx.lineTo((canvasStart - first) * scale, halfOffset - Math.round((peaks[2 * canvasStart + 1] || 0) / absmaxHalf));
	      ctx.closePath();
	      ctx.fill();
	    }
	    /**
	     * Destroys this entry
	     */

	  }, {
	    key: "destroy",
	    value: function destroy() {
	      this.waveCtx = null;
	      this.wave = null;
	      this.progressCtx = null;
	      this.progress = null;
	    }
	    /**
	     * Return image data of the wave `canvas` element
	     *
	     * When using a `type` of `'blob'`, this will return a `Promise` that
	     * resolves with a `Blob` instance.
	     *
	     * @param {string} format='image/png' An optional value of a format type.
	     * @param {number} quality=0.92 An optional value between 0 and 1.
	     * @param {string} type='dataURL' Either 'dataURL' or 'blob'.
	     * @return {string|Promise} When using the default `'dataURL'` `type` this
	     * returns a data URL. When using the `'blob'` `type` this returns a
	     * `Promise` that resolves with a `Blob` instance.
	     */

	  }, {
	    key: "getImage",
	    value: function getImage(format, quality, type) {
	      var _this = this;

	      if (type === 'blob') {
	        return new Promise(function (resolve) {
	          _this.wave.toBlob(resolve, format, quality);
	        });
	      } else if (type === 'dataURL') {
	        return this.wave.toDataURL(format, quality);
	      }
	    }
	  }]);

	  return CanvasEntry;
	}();

	exports["default"] = CanvasEntry;
	module.exports = exports.default;

	/***/ }),

	/***/ "./src/drawer.js":
	/*!***********************!*\
	  !*** ./src/drawer.js ***!
	  \***********************/
	/***/ ((module, exports, __webpack_require__) => {


	function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

	Object.defineProperty(exports, "__esModule", ({
	  value: true
	}));
	exports["default"] = void 0;

	var util = _interopRequireWildcard(__webpack_require__(/*! ./util */ "./src/util/index.js"));

	function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

	function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

	function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }

	function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

	function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

	function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

	function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

	function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

	function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

	/**
	 * Parent class for renderers
	 *
	 * @extends {Observer}
	 */
	var Drawer = /*#__PURE__*/function (_util$Observer) {
	  _inherits(Drawer, _util$Observer);

	  var _super = _createSuper(Drawer);

	  /**
	   * @param {HTMLElement} container The container node of the wavesurfer instance
	   * @param {WavesurferParams} params The wavesurfer initialisation options
	   */
	  function Drawer(container, params) {
	    var _this;

	    _classCallCheck(this, Drawer);

	    _this = _super.call(this);
	    _this.container = util.withOrientation(container, params.vertical);
	    /**
	     * @type {WavesurferParams}
	     */

	    _this.params = params;
	    /**
	     * The width of the renderer
	     * @type {number}
	     */

	    _this.width = 0;
	    /**
	     * The height of the renderer
	     * @type {number}
	     */

	    _this.height = params.height * _this.params.pixelRatio;
	    _this.lastPos = 0;
	    /**
	     * The `<wave>` element which is added to the container
	     * @type {HTMLElement}
	     */

	    _this.wrapper = null;
	    return _this;
	  }
	  /**
	   * Alias of `util.style`
	   *
	   * @param {HTMLElement} el The element that the styles will be applied to
	   * @param {Object} styles The map of propName: attribute, both are used as-is
	   * @return {HTMLElement} el
	   */


	  _createClass(Drawer, [{
	    key: "style",
	    value: function style(el, styles) {
	      return util.style(el, styles);
	    }
	    /**
	     * Create the wrapper `<wave>` element, style it and set up the events for
	     * interaction
	     */

	  }, {
	    key: "createWrapper",
	    value: function createWrapper() {
	      this.wrapper = util.withOrientation(this.container.appendChild(document.createElement('wave')), this.params.vertical);
	      this.style(this.wrapper, {
	        display: 'block',
	        position: 'relative',
	        userSelect: 'none',
	        webkitUserSelect: 'none',
	        height: this.params.height + 'px'
	      });

	      if (this.params.fillParent || this.params.scrollParent) {
	        this.style(this.wrapper, {
	          width: '100%',
	          cursor: this.params.hideCursor ? 'none' : 'auto',
	          overflowX: this.params.hideScrollbar ? 'hidden' : 'auto',
	          overflowY: 'hidden'
	        });
	      }

	      this.setupWrapperEvents();
	    }
	    /**
	     * Handle click event
	     *
	     * @param {Event} e Click event
	     * @param {?boolean} noPrevent Set to true to not call `e.preventDefault()`
	     * @return {number} Playback position from 0 to 1
	     */

	  }, {
	    key: "handleEvent",
	    value: function handleEvent(e, noPrevent) {
	      !noPrevent && e.preventDefault();
	      var clientX = util.withOrientation(e.targetTouches ? e.targetTouches[0] : e, this.params.vertical).clientX;
	      var bbox = this.wrapper.getBoundingClientRect();
	      var nominalWidth = this.width;
	      var parentWidth = this.getWidth();
	      var progressPixels = this.getProgressPixels(bbox, clientX);
	      var progress;

	      if (!this.params.fillParent && nominalWidth < parentWidth) {
	        progress = progressPixels * (this.params.pixelRatio / nominalWidth) || 0;
	      } else {
	        progress = (progressPixels + this.wrapper.scrollLeft) / this.wrapper.scrollWidth || 0;
	      }

	      return util.clamp(progress, 0, 1);
	    }
	  }, {
	    key: "getProgressPixels",
	    value: function getProgressPixels(wrapperBbox, clientX) {
	      if (this.params.rtl) {
	        return wrapperBbox.right - clientX;
	      } else {
	        return clientX - wrapperBbox.left;
	      }
	    }
	  }, {
	    key: "setupWrapperEvents",
	    value: function setupWrapperEvents() {
	      var _this2 = this;

	      this.wrapper.addEventListener('click', function (e) {
	        var orientedEvent = util.withOrientation(e, _this2.params.vertical);
	        var scrollbarHeight = _this2.wrapper.offsetHeight - _this2.wrapper.clientHeight;

	        if (scrollbarHeight !== 0) {
	          // scrollbar is visible.  Check if click was on it
	          var bbox = _this2.wrapper.getBoundingClientRect();

	          if (orientedEvent.clientY >= bbox.bottom - scrollbarHeight) {
	            // ignore mousedown as it was on the scrollbar
	            return;
	          }
	        }

	        if (_this2.params.interact) {
	          _this2.fireEvent('click', e, _this2.handleEvent(e));
	        }
	      });
	      this.wrapper.addEventListener('dblclick', function (e) {
	        if (_this2.params.interact) {
	          _this2.fireEvent('dblclick', e, _this2.handleEvent(e));
	        }
	      });
	      this.wrapper.addEventListener('scroll', function (e) {
	        return _this2.fireEvent('scroll', e);
	      });
	    }
	    /**
	     * Draw peaks on the canvas
	     *
	     * @param {number[]|Number.<Array[]>} peaks Can also be an array of arrays
	     * for split channel rendering
	     * @param {number} length The width of the area that should be drawn
	     * @param {number} start The x-offset of the beginning of the area that
	     * should be rendered
	     * @param {number} end The x-offset of the end of the area that should be
	     * rendered
	     */

	  }, {
	    key: "drawPeaks",
	    value: function drawPeaks(peaks, length, start, end) {
	      if (!this.setWidth(length)) {
	        this.clearWave();
	      }

	      this.params.barWidth ? this.drawBars(peaks, 0, start, end) : this.drawWave(peaks, 0, start, end);
	    }
	    /**
	     * Scroll to the beginning
	     */

	  }, {
	    key: "resetScroll",
	    value: function resetScroll() {
	      if (this.wrapper !== null) {
	        this.wrapper.scrollLeft = 0;
	      }
	    }
	    /**
	     * Recenter the view-port at a certain percent of the waveform
	     *
	     * @param {number} percent Value from 0 to 1 on the waveform
	     */

	  }, {
	    key: "recenter",
	    value: function recenter(percent) {
	      var position = this.wrapper.scrollWidth * percent;
	      this.recenterOnPosition(position, true);
	    }
	    /**
	     * Recenter the view-port on a position, either scroll there immediately or
	     * in steps of 5 pixels
	     *
	     * @param {number} position X-offset in pixels
	     * @param {boolean} immediate Set to true to immediately scroll somewhere
	     */

	  }, {
	    key: "recenterOnPosition",
	    value: function recenterOnPosition(position, immediate) {
	      var scrollLeft = this.wrapper.scrollLeft;
	      var half = ~~(this.wrapper.clientWidth / 2);
	      var maxScroll = this.wrapper.scrollWidth - this.wrapper.clientWidth;
	      var target = position - half;
	      var offset = target - scrollLeft;

	      if (maxScroll == 0) {
	        // no need to continue if scrollbar is not there
	        return;
	      } // if the cursor is currently visible...


	      if (!immediate && -half <= offset && offset < half) {
	        // set rate at which waveform is centered
	        var rate = this.params.autoCenterRate; // make rate depend on width of view and length of waveform

	        rate /= half;
	        rate *= maxScroll;
	        offset = Math.max(-rate, Math.min(rate, offset));
	        target = scrollLeft + offset;
	      } // limit target to valid range (0 to maxScroll)


	      target = Math.max(0, Math.min(maxScroll, target)); // no use attempting to scroll if we're not moving

	      if (target != scrollLeft) {
	        this.wrapper.scrollLeft = target;
	      }
	    }
	    /**
	     * Get the current scroll position in pixels
	     *
	     * @return {number} Horizontal scroll position in pixels
	     */

	  }, {
	    key: "getScrollX",
	    value: function getScrollX() {
	      var x = 0;

	      if (this.wrapper) {
	        var pixelRatio = this.params.pixelRatio;
	        x = Math.round(this.wrapper.scrollLeft * pixelRatio); // In cases of elastic scroll (safari with mouse wheel) you can
	        // scroll beyond the limits of the container
	        // Calculate and floor the scrollable extent to make sure an out
	        // of bounds value is not returned
	        // Ticket #1312

	        if (this.params.scrollParent) {
	          var maxScroll = ~~(this.wrapper.scrollWidth * pixelRatio - this.getWidth());
	          x = Math.min(maxScroll, Math.max(0, x));
	        }
	      }

	      return x;
	    }
	    /**
	     * Get the width of the container
	     *
	     * @return {number} The width of the container
	     */

	  }, {
	    key: "getWidth",
	    value: function getWidth() {
	      return Math.round(this.container.clientWidth * this.params.pixelRatio);
	    }
	    /**
	     * Set the width of the container
	     *
	     * @param {number} width The new width of the container
	     * @return {boolean} Whether the width of the container was updated or not
	     */

	  }, {
	    key: "setWidth",
	    value: function setWidth(width) {
	      if (this.width == width) {
	        return false;
	      }

	      this.width = width;

	      if (this.params.fillParent || this.params.scrollParent) {
	        this.style(this.wrapper, {
	          width: ''
	        });
	      } else {
	        var newWidth = ~~(this.width / this.params.pixelRatio) + 'px';
	        this.style(this.wrapper, {
	          width: newWidth
	        });
	      }

	      this.updateSize();
	      return true;
	    }
	    /**
	     * Set the height of the container
	     *
	     * @param {number} height The new height of the container.
	     * @return {boolean} Whether the height of the container was updated or not
	     */

	  }, {
	    key: "setHeight",
	    value: function setHeight(height) {
	      if (height == this.height) {
	        return false;
	      }

	      this.height = height;
	      this.style(this.wrapper, {
	        height: ~~(this.height / this.params.pixelRatio) + 'px'
	      });
	      this.updateSize();
	      return true;
	    }
	    /**
	     * Called by wavesurfer when progress should be rendered
	     *
	     * @param {number} progress From 0 to 1
	     */

	  }, {
	    key: "progress",
	    value: function progress(_progress) {
	      var minPxDelta = 1 / this.params.pixelRatio;
	      var pos = Math.round(_progress * this.width) * minPxDelta;

	      if (pos < this.lastPos || pos - this.lastPos >= minPxDelta) {
	        this.lastPos = pos;

	        if (this.params.scrollParent && this.params.autoCenter) {
	          var newPos = ~~(this.wrapper.scrollWidth * _progress);
	          this.recenterOnPosition(newPos, this.params.autoCenterImmediately);
	        }

	        this.updateProgress(pos);
	      }
	    }
	    /**
	     * This is called when wavesurfer is destroyed
	     */

	  }, {
	    key: "destroy",
	    value: function destroy() {
	      this.unAll();

	      if (this.wrapper) {
	        if (this.wrapper.parentNode == this.container.domElement) {
	          this.container.removeChild(this.wrapper.domElement);
	        }

	        this.wrapper = null;
	      }
	    }
	    /* Renderer-specific methods */

	    /**
	     * Called after cursor related params have changed.
	     *
	     * @abstract
	     */

	  }, {
	    key: "updateCursor",
	    value: function updateCursor() {}
	    /**
	     * Called when the size of the container changes so the renderer can adjust
	     *
	     * @abstract
	     */

	  }, {
	    key: "updateSize",
	    value: function updateSize() {}
	    /**
	     * Draw a waveform with bars
	     *
	     * @abstract
	     * @param {number[]|Number.<Array[]>} peaks Can also be an array of arrays for split channel
	     * rendering
	     * @param {number} channelIndex The index of the current channel. Normally
	     * should be 0
	     * @param {number} start The x-offset of the beginning of the area that
	     * should be rendered
	     * @param {number} end The x-offset of the end of the area that should be
	     * rendered
	     */

	  }, {
	    key: "drawBars",
	    value: function drawBars(peaks, channelIndex, start, end) {}
	    /**
	     * Draw a waveform
	     *
	     * @abstract
	     * @param {number[]|Number.<Array[]>} peaks Can also be an array of arrays for split channel
	     * rendering
	     * @param {number} channelIndex The index of the current channel. Normally
	     * should be 0
	     * @param {number} start The x-offset of the beginning of the area that
	     * should be rendered
	     * @param {number} end The x-offset of the end of the area that should be
	     * rendered
	     */

	  }, {
	    key: "drawWave",
	    value: function drawWave(peaks, channelIndex, start, end) {}
	    /**
	     * Clear the waveform
	     *
	     * @abstract
	     */

	  }, {
	    key: "clearWave",
	    value: function clearWave() {}
	    /**
	     * Render the new progress
	     *
	     * @abstract
	     * @param {number} position X-Offset of progress position in pixels
	     */

	  }, {
	    key: "updateProgress",
	    value: function updateProgress(position) {}
	  }]);

	  return Drawer;
	}(util.Observer);

	exports["default"] = Drawer;
	module.exports = exports.default;

	/***/ }),

	/***/ "./src/drawer.multicanvas.js":
	/*!***********************************!*\
	  !*** ./src/drawer.multicanvas.js ***!
	  \***********************************/
	/***/ ((module, exports, __webpack_require__) => {


	function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

	Object.defineProperty(exports, "__esModule", ({
	  value: true
	}));
	exports["default"] = void 0;

	var _drawer = _interopRequireDefault(__webpack_require__(/*! ./drawer */ "./src/drawer.js"));

	var util = _interopRequireWildcard(__webpack_require__(/*! ./util */ "./src/util/index.js"));

	var _drawer2 = _interopRequireDefault(__webpack_require__(/*! ./drawer.canvasentry */ "./src/drawer.canvasentry.js"));

	function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

	function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

	function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }

	function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

	function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

	function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

	function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

	function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

	function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

	/**
	 * MultiCanvas renderer for wavesurfer. Is currently the default and sole
	 * builtin renderer.
	 *
	 * A `MultiCanvas` consists of one or more `CanvasEntry` instances, depending
	 * on the zoom level.
	 */
	var MultiCanvas = /*#__PURE__*/function (_Drawer) {
	  _inherits(MultiCanvas, _Drawer);

	  var _super = _createSuper(MultiCanvas);

	  /**
	   * @param {HTMLElement} container The container node of the wavesurfer instance
	   * @param {WavesurferParams} params The wavesurfer initialisation options
	   */
	  function MultiCanvas(container, params) {
	    var _this;

	    _classCallCheck(this, MultiCanvas);

	    _this = _super.call(this, container, params);
	    /**
	     * @type {number}
	     */

	    _this.maxCanvasWidth = params.maxCanvasWidth;
	    /**
	     * @type {number}
	     */

	    _this.maxCanvasElementWidth = Math.round(params.maxCanvasWidth / params.pixelRatio);
	    /**
	     * Whether or not the progress wave is rendered. If the `waveColor`
	     * and `progressColor` are the same color it is not.
	     *
	     * @type {boolean}
	     */

	    _this.hasProgressCanvas = params.waveColor != params.progressColor;
	    /**
	     * @type {number}
	     */

	    _this.halfPixel = 0.5 / params.pixelRatio;
	    /**
	     * List of `CanvasEntry` instances.
	     *
	     * @type {Array}
	     */

	    _this.canvases = [];
	    /**
	     * @type {HTMLElement}
	     */

	    _this.progressWave = null;
	    /**
	     * Class used to generate entries.
	     *
	     * @type {function}
	     */

	    _this.EntryClass = _drawer2.default;
	    /**
	     * Canvas 2d context attributes.
	     *
	     * @type {object}
	     */

	    _this.canvasContextAttributes = params.drawingContextAttributes;
	    /**
	     * Overlap added between entries to prevent vertical white stripes
	     * between `canvas` elements.
	     *
	     * @type {number}
	     */

	    _this.overlap = 2 * Math.ceil(params.pixelRatio / 2);
	    /**
	     * The radius of the wave bars. Makes bars rounded
	     *
	     * @type {number}
	     */

	    _this.barRadius = params.barRadius || 0;
	    /**
	     * Whether to render the waveform vertically. Defaults to false.
	     *
	     * @type {boolean}
	     */

	    _this.vertical = params.vertical;
	    return _this;
	  }
	  /**
	   * Initialize the drawer
	   */


	  _createClass(MultiCanvas, [{
	    key: "init",
	    value: function init() {
	      this.createWrapper();
	      this.createElements();
	    }
	    /**
	     * Create the canvas elements and style them
	     *
	     */

	  }, {
	    key: "createElements",
	    value: function createElements() {
	      this.progressWave = util.withOrientation(this.wrapper.appendChild(document.createElement('wave')), this.params.vertical);
	      this.style(this.progressWave, {
	        position: 'absolute',
	        zIndex: 3,
	        left: 0,
	        top: 0,
	        bottom: 0,
	        overflow: 'hidden',
	        width: '0',
	        display: 'none',
	        boxSizing: 'border-box',
	        borderRightStyle: 'solid',
	        pointerEvents: 'none'
	      });
	      this.addCanvas();
	      this.updateCursor();
	    }
	    /**
	     * Update cursor style
	     */

	  }, {
	    key: "updateCursor",
	    value: function updateCursor() {
	      this.style(this.progressWave, {
	        borderRightWidth: this.params.cursorWidth + 'px',
	        borderRightColor: this.params.cursorColor
	      });
	    }
	    /**
	     * Adjust to the updated size by adding or removing canvases
	     */

	  }, {
	    key: "updateSize",
	    value: function updateSize() {
	      var _this2 = this;

	      var totalWidth = Math.round(this.width / this.params.pixelRatio);
	      var requiredCanvases = Math.ceil(totalWidth / (this.maxCanvasElementWidth + this.overlap)); // add required canvases

	      while (this.canvases.length < requiredCanvases) {
	        this.addCanvas();
	      } // remove older existing canvases, if any


	      while (this.canvases.length > requiredCanvases) {
	        this.removeCanvas();
	      }

	      var canvasWidth = this.maxCanvasWidth + this.overlap;
	      var lastCanvas = this.canvases.length - 1;
	      this.canvases.forEach(function (entry, i) {
	        if (i == lastCanvas) {
	          canvasWidth = _this2.width - _this2.maxCanvasWidth * lastCanvas;
	        }

	        _this2.updateDimensions(entry, canvasWidth, _this2.height);

	        entry.clearWave();
	      });
	    }
	    /**
	     * Add a canvas to the canvas list
	     *
	     */

	  }, {
	    key: "addCanvas",
	    value: function addCanvas() {
	      var entry = new this.EntryClass();
	      entry.canvasContextAttributes = this.canvasContextAttributes;
	      entry.hasProgressCanvas = this.hasProgressCanvas;
	      entry.halfPixel = this.halfPixel;
	      var leftOffset = this.maxCanvasElementWidth * this.canvases.length; // wave

	      var wave = util.withOrientation(this.wrapper.appendChild(document.createElement('canvas')), this.params.vertical);
	      this.style(wave, {
	        position: 'absolute',
	        zIndex: 2,
	        left: leftOffset + 'px',
	        top: 0,
	        bottom: 0,
	        height: '100%',
	        pointerEvents: 'none'
	      });
	      entry.initWave(wave); // progress

	      if (this.hasProgressCanvas) {
	        var progress = util.withOrientation(this.progressWave.appendChild(document.createElement('canvas')), this.params.vertical);
	        this.style(progress, {
	          position: 'absolute',
	          left: leftOffset + 'px',
	          top: 0,
	          bottom: 0,
	          height: '100%'
	        });
	        entry.initProgress(progress);
	      }

	      this.canvases.push(entry);
	    }
	    /**
	     * Pop single canvas from the list
	     *
	     */

	  }, {
	    key: "removeCanvas",
	    value: function removeCanvas() {
	      var lastEntry = this.canvases[this.canvases.length - 1]; // wave

	      lastEntry.wave.parentElement.removeChild(lastEntry.wave.domElement); // progress

	      if (this.hasProgressCanvas) {
	        lastEntry.progress.parentElement.removeChild(lastEntry.progress.domElement);
	      } // cleanup


	      if (lastEntry) {
	        lastEntry.destroy();
	        lastEntry = null;
	      }

	      this.canvases.pop();
	    }
	    /**
	     * Update the dimensions of a canvas element
	     *
	     * @param {CanvasEntry} entry Target entry
	     * @param {number} width The new width of the element
	     * @param {number} height The new height of the element
	     */

	  }, {
	    key: "updateDimensions",
	    value: function updateDimensions(entry, width, height) {
	      var elementWidth = Math.round(width / this.params.pixelRatio);
	      var totalWidth = Math.round(this.width / this.params.pixelRatio); // update canvas dimensions

	      entry.updateDimensions(elementWidth, totalWidth, width, height); // style element

	      this.style(this.progressWave, {
	        display: 'block'
	      });
	    }
	    /**
	     * Clear the whole multi-canvas
	     */

	  }, {
	    key: "clearWave",
	    value: function clearWave() {
	      var _this3 = this;

	      util.frame(function () {
	        _this3.canvases.forEach(function (entry) {
	          return entry.clearWave();
	        });
	      })();
	    }
	    /**
	     * Draw a waveform with bars
	     *
	     * @param {number[]|Number.<Array[]>} peaks Can also be an array of arrays
	     * for split channel rendering
	     * @param {number} channelIndex The index of the current channel. Normally
	     * should be 0. Must be an integer.
	     * @param {number} start The x-offset of the beginning of the area that
	     * should be rendered
	     * @param {number} end The x-offset of the end of the area that should be
	     * rendered
	     * @returns {void}
	     */

	  }, {
	    key: "drawBars",
	    value: function drawBars(peaks, channelIndex, start, end) {
	      var _this4 = this;

	      return this.prepareDraw(peaks, channelIndex, start, end, function (_ref) {
	        var absmax = _ref.absmax,
	            hasMinVals = _ref.hasMinVals;
	            _ref.height;
	            var offsetY = _ref.offsetY,
	            halfH = _ref.halfH,
	            peaks = _ref.peaks,
	            ch = _ref.channelIndex;

	        // if drawBars was called within ws.empty we don't pass a start and
	        // don't want anything to happen
	        if (start === undefined) {
	          return;
	        } // Skip every other value if there are negatives.


	        var peakIndexScale = hasMinVals ? 2 : 1;
	        var length = peaks.length / peakIndexScale;
	        var bar = _this4.params.barWidth * _this4.params.pixelRatio;
	        var gap = _this4.params.barGap === null ? Math.max(_this4.params.pixelRatio, ~~(bar / 2)) : Math.max(_this4.params.pixelRatio, _this4.params.barGap * _this4.params.pixelRatio);
	        var step = bar + gap;
	        var scale = length / _this4.width;
	        var first = start;
	        var last = end;
	        var peakIndex = first;

	        for (peakIndex; peakIndex < last; peakIndex += step) {
	          // search for the highest peak in the range this bar falls into
	          var peak = 0;
	          var peakIndexRange = Math.floor(peakIndex * scale) * peakIndexScale; // start index

	          var peakIndexEnd = Math.floor((peakIndex + step) * scale) * peakIndexScale;

	          do {
	            // do..while makes sure at least one peak is always evaluated
	            var newPeak = Math.abs(peaks[peakIndexRange]); // for arrays starting with negative values

	            if (newPeak > peak) {
	              peak = newPeak; // higher
	            }

	            peakIndexRange += peakIndexScale; // skip every other value for negatives
	          } while (peakIndexRange < peakIndexEnd); // calculate the height of this bar according to the highest peak found


	          var h = Math.round(peak / absmax * halfH); // in case of silences, allow the user to specify that we
	          // always draw *something* (normally a 1px high bar)

	          if (h == 0 && _this4.params.barMinHeight) {
	            h = _this4.params.barMinHeight;
	          }

	          _this4.fillRect(peakIndex + _this4.halfPixel, halfH - h + offsetY, bar + _this4.halfPixel, h * 2, _this4.barRadius, ch);
	        }
	      });
	    }
	    /**
	     * Draw a waveform
	     *
	     * @param {number[]|Number.<Array[]>} peaks Can also be an array of arrays
	     * for split channel rendering
	     * @param {number} channelIndex The index of the current channel. Normally
	     * should be 0
	     * @param {number?} start The x-offset of the beginning of the area that
	     * should be rendered (If this isn't set only a flat line is rendered)
	     * @param {number?} end The x-offset of the end of the area that should be
	     * rendered
	     * @returns {void}
	     */

	  }, {
	    key: "drawWave",
	    value: function drawWave(peaks, channelIndex, start, end) {
	      var _this5 = this;

	      return this.prepareDraw(peaks, channelIndex, start, end, function (_ref2) {
	        var absmax = _ref2.absmax,
	            hasMinVals = _ref2.hasMinVals;
	            _ref2.height;
	            var offsetY = _ref2.offsetY,
	            halfH = _ref2.halfH,
	            peaks = _ref2.peaks,
	            channelIndex = _ref2.channelIndex;

	        if (!hasMinVals) {
	          var reflectedPeaks = [];
	          var len = peaks.length;
	          var i = 0;

	          for (i; i < len; i++) {
	            reflectedPeaks[2 * i] = peaks[i];
	            reflectedPeaks[2 * i + 1] = -peaks[i];
	          }

	          peaks = reflectedPeaks;
	        } // if drawWave was called within ws.empty we don't pass a start and
	        // end and simply want a flat line


	        if (start !== undefined) {
	          _this5.drawLine(peaks, absmax, halfH, offsetY, start, end, channelIndex);
	        } // always draw a median line


	        _this5.fillRect(0, halfH + offsetY - _this5.halfPixel, _this5.width, _this5.halfPixel, _this5.barRadius, channelIndex);
	      });
	    }
	    /**
	     * Tell the canvas entries to render their portion of the waveform
	     *
	     * @param {number[]} peaks Peaks data
	     * @param {number} absmax Maximum peak value (absolute)
	     * @param {number} halfH Half the height of the waveform
	     * @param {number} offsetY Offset to the top
	     * @param {number} start The x-offset of the beginning of the area that
	     * should be rendered
	     * @param {number} end The x-offset of the end of the area that
	     * should be rendered
	     * @param {channelIndex} channelIndex The channel index of the line drawn
	     */

	  }, {
	    key: "drawLine",
	    value: function drawLine(peaks, absmax, halfH, offsetY, start, end, channelIndex) {
	      var _this6 = this;

	      var _ref3 = this.params.splitChannelsOptions.channelColors[channelIndex] || {},
	          waveColor = _ref3.waveColor,
	          progressColor = _ref3.progressColor;

	      this.canvases.forEach(function (entry, i) {
	        _this6.setFillStyles(entry, waveColor, progressColor);

	        _this6.applyCanvasTransforms(entry, _this6.params.vertical);

	        entry.drawLines(peaks, absmax, halfH, offsetY, start, end);
	      });
	    }
	    /**
	     * Draw a rectangle on the multi-canvas
	     *
	     * @param {number} x X-position of the rectangle
	     * @param {number} y Y-position of the rectangle
	     * @param {number} width Width of the rectangle
	     * @param {number} height Height of the rectangle
	     * @param {number} radius Radius of the rectangle
	     * @param {channelIndex} channelIndex The channel index of the bar drawn
	     */

	  }, {
	    key: "fillRect",
	    value: function fillRect(x, y, width, height, radius, channelIndex) {
	      var startCanvas = Math.floor(x / this.maxCanvasWidth);
	      var endCanvas = Math.min(Math.ceil((x + width) / this.maxCanvasWidth) + 1, this.canvases.length);
	      var i = startCanvas;

	      for (i; i < endCanvas; i++) {
	        var entry = this.canvases[i];
	        var leftOffset = i * this.maxCanvasWidth;
	        var intersection = {
	          x1: Math.max(x, i * this.maxCanvasWidth),
	          y1: y,
	          x2: Math.min(x + width, i * this.maxCanvasWidth + entry.wave.width),
	          y2: y + height
	        };

	        if (intersection.x1 < intersection.x2) {
	          var _ref4 = this.params.splitChannelsOptions.channelColors[channelIndex] || {},
	              waveColor = _ref4.waveColor,
	              progressColor = _ref4.progressColor;

	          this.setFillStyles(entry, waveColor, progressColor);
	          this.applyCanvasTransforms(entry, this.params.vertical);
	          entry.fillRects(intersection.x1 - leftOffset, intersection.y1, intersection.x2 - intersection.x1, intersection.y2 - intersection.y1, radius);
	        }
	      }
	    }
	    /**
	     * Returns whether to hide the channel from being drawn based on params.
	     *
	     * @param {number} channelIndex The index of the current channel.
	     * @returns {bool} True to hide the channel, false to draw.
	     */

	  }, {
	    key: "hideChannel",
	    value: function hideChannel(channelIndex) {
	      return this.params.splitChannels && this.params.splitChannelsOptions.filterChannels.includes(channelIndex);
	    }
	    /**
	     * Performs preparation tasks and calculations which are shared by `drawBars`
	     * and `drawWave`
	     *
	     * @param {number[]|Number.<Array[]>} peaks Can also be an array of arrays for
	     * split channel rendering
	     * @param {number} channelIndex The index of the current channel. Normally
	     * should be 0
	     * @param {number?} start The x-offset of the beginning of the area that
	     * should be rendered. If this isn't set only a flat line is rendered
	     * @param {number?} end The x-offset of the end of the area that should be
	     * rendered
	     * @param {function} fn The render function to call, e.g. `drawWave`
	     * @param {number} drawIndex The index of the current channel after filtering.
	     * @param {number?} normalizedMax Maximum modulation value across channels for use with relativeNormalization. Ignored when undefined
	     * @returns {void}
	     */

	  }, {
	    key: "prepareDraw",
	    value: function prepareDraw(peaks, channelIndex, start, end, fn, drawIndex, normalizedMax) {
	      var _this7 = this;

	      return util.frame(function () {
	        // Split channels and call this function with the channelIndex set
	        if (peaks[0] instanceof Array) {
	          var channels = peaks;

	          if (_this7.params.splitChannels) {
	            var filteredChannels = channels.filter(function (c, i) {
	              return !_this7.hideChannel(i);
	            });

	            if (!_this7.params.splitChannelsOptions.overlay) {
	              _this7.setHeight(Math.max(filteredChannels.length, 1) * _this7.params.height * _this7.params.pixelRatio);
	            }

	            var overallAbsMax;

	            if (_this7.params.splitChannelsOptions && _this7.params.splitChannelsOptions.relativeNormalization) {
	              // calculate maximum peak across channels to use for normalization
	              overallAbsMax = util.max(channels.map(function (channelPeaks) {
	                return util.absMax(channelPeaks);
	              }));
	            }

	            return channels.forEach(function (channelPeaks, i) {
	              return _this7.prepareDraw(channelPeaks, i, start, end, fn, filteredChannels.indexOf(channelPeaks), overallAbsMax);
	            });
	          }

	          peaks = channels[0];
	        } // Return and do not draw channel peaks if hidden.


	        if (_this7.hideChannel(channelIndex)) {
	          return;
	        } // calculate maximum modulation value, either from the barHeight
	        // parameter or if normalize=true from the largest value in the peak
	        // set


	        var absmax = 1 / _this7.params.barHeight;

	        if (_this7.params.normalize) {
	          absmax = normalizedMax === undefined ? util.absMax(peaks) : normalizedMax;
	        } // Bar wave draws the bottom only as a reflection of the top,
	        // so we don't need negative values


	        var hasMinVals = [].some.call(peaks, function (val) {
	          return val < 0;
	        });
	        var height = _this7.params.height * _this7.params.pixelRatio;
	        var halfH = height / 2;
	        var offsetY = height * drawIndex || 0; // Override offsetY if overlay is true

	        if (_this7.params.splitChannelsOptions && _this7.params.splitChannelsOptions.overlay) {
	          offsetY = 0;
	        }

	        return fn({
	          absmax: absmax,
	          hasMinVals: hasMinVals,
	          height: height,
	          offsetY: offsetY,
	          halfH: halfH,
	          peaks: peaks,
	          channelIndex: channelIndex
	        });
	      })();
	    }
	    /**
	     * Set the fill styles for a certain entry (wave and progress)
	     *
	     * @param {CanvasEntry} entry Target entry
	     * @param {string} waveColor Wave color to draw this entry
	     * @param {string} progressColor Progress color to draw this entry
	     */

	  }, {
	    key: "setFillStyles",
	    value: function setFillStyles(entry) {
	      var waveColor = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.params.waveColor;
	      var progressColor = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.params.progressColor;
	      entry.setFillStyles(waveColor, progressColor);
	    }
	    /**
	     * Set the canvas transforms for a certain entry (wave and progress)
	     *
	     * @param {CanvasEntry} entry Target entry
	     * @param {boolean} vertical Whether to render the waveform vertically
	     */

	  }, {
	    key: "applyCanvasTransforms",
	    value: function applyCanvasTransforms(entry) {
	      var vertical = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
	      entry.applyCanvasTransforms(vertical);
	    }
	    /**
	     * Return image data of the multi-canvas
	     *
	     * When using a `type` of `'blob'`, this will return a `Promise`.
	     *
	     * @param {string} format='image/png' An optional value of a format type.
	     * @param {number} quality=0.92 An optional value between 0 and 1.
	     * @param {string} type='dataURL' Either 'dataURL' or 'blob'.
	     * @return {string|string[]|Promise} When using the default `'dataURL'`
	     * `type` this returns a single data URL or an array of data URLs,
	     * one for each canvas. When using the `'blob'` `type` this returns a
	     * `Promise` that resolves with an array of `Blob` instances, one for each
	     * canvas.
	     */

	  }, {
	    key: "getImage",
	    value: function getImage(format, quality, type) {
	      if (type === 'blob') {
	        return Promise.all(this.canvases.map(function (entry) {
	          return entry.getImage(format, quality, type);
	        }));
	      } else if (type === 'dataURL') {
	        var images = this.canvases.map(function (entry) {
	          return entry.getImage(format, quality, type);
	        });
	        return images.length > 1 ? images : images[0];
	      }
	    }
	    /**
	     * Render the new progress
	     *
	     * @param {number} position X-offset of progress position in pixels
	     */

	  }, {
	    key: "updateProgress",
	    value: function updateProgress(position) {
	      this.style(this.progressWave, {
	        width: position + 'px'
	      });
	    }
	  }]);

	  return MultiCanvas;
	}(_drawer.default);

	exports["default"] = MultiCanvas;
	module.exports = exports.default;

	/***/ }),

	/***/ "./src/mediaelement-webaudio.js":
	/*!**************************************!*\
	  !*** ./src/mediaelement-webaudio.js ***!
	  \**************************************/
	/***/ ((module, exports, __webpack_require__) => {


	function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

	Object.defineProperty(exports, "__esModule", ({
	  value: true
	}));
	exports["default"] = void 0;

	var _mediaelement = _interopRequireDefault(__webpack_require__(/*! ./mediaelement */ "./src/mediaelement.js"));

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

	function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

	function _get() { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(arguments.length < 3 ? target : receiver); } return desc.value; }; } return _get.apply(this, arguments); }

	function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }

	function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

	function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

	function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

	function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

	function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

	function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

	/**
	 * MediaElementWebAudio backend: load audio via an HTML5 audio tag, but playback with the WebAudio API.
	 * The advantage here is that the html5 <audio> tag can perform range requests on the server and not
	 * buffer the entire file in one request, and you still get the filtering and scripting functionality
	 * of the webaudio API.
	 * Note that in order to use range requests and prevent buffering, you must provide peak data.
	 *
	 * @since 3.2.0
	 */
	var MediaElementWebAudio = /*#__PURE__*/function (_MediaElement) {
	  _inherits(MediaElementWebAudio, _MediaElement);

	  var _super = _createSuper(MediaElementWebAudio);

	  /**
	   * Construct the backend
	   *
	   * @param {WavesurferParams} params Wavesurfer parameters
	   */
	  function MediaElementWebAudio(params) {
	    var _this;

	    _classCallCheck(this, MediaElementWebAudio);

	    _this = _super.call(this, params);
	    /** @private */

	    _this.params = params;
	    /** @private */

	    _this.sourceMediaElement = null;
	    return _this;
	  }
	  /**
	   * Initialise the backend, called in `wavesurfer.createBackend()`
	   */


	  _createClass(MediaElementWebAudio, [{
	    key: "init",
	    value: function init() {
	      this.setPlaybackRate(this.params.audioRate);
	      this.createTimer();
	      this.createVolumeNode();
	      this.createScriptNode();
	      this.createAnalyserNode();
	    }
	    /**
	     * Private method called by both `load` (from url)
	     * and `loadElt` (existing media element) methods.
	     *
	     * @param {HTMLMediaElement} media HTML5 Audio or Video element
	     * @param {number[]|Number.<Array[]>} peaks Array of peak data
	     * @param {string} preload HTML 5 preload attribute value
	     * @private
	     */

	  }, {
	    key: "_load",
	    value: function _load(media, peaks, preload) {
	      _get(_getPrototypeOf(MediaElementWebAudio.prototype), "_load", this).call(this, media, peaks, preload);

	      this.createMediaElementSource(media);
	    }
	    /**
	     * Create MediaElementSource node
	     *
	     * @since 3.2.0
	     * @param {HTMLMediaElement} mediaElement HTML5 Audio to load
	     */

	  }, {
	    key: "createMediaElementSource",
	    value: function createMediaElementSource(mediaElement) {
	      this.sourceMediaElement = this.ac.createMediaElementSource(mediaElement);
	      this.sourceMediaElement.connect(this.analyser);
	    }
	  }, {
	    key: "play",
	    value: function play(start, end) {
	      this.resumeAudioContext();
	      return _get(_getPrototypeOf(MediaElementWebAudio.prototype), "play", this).call(this, start, end);
	    }
	    /**
	     * This is called when wavesurfer is destroyed
	     *
	     */

	  }, {
	    key: "destroy",
	    value: function destroy() {
	      _get(_getPrototypeOf(MediaElementWebAudio.prototype), "destroy", this).call(this);

	      this.destroyWebAudio();
	    }
	  }]);

	  return MediaElementWebAudio;
	}(_mediaelement.default);

	exports["default"] = MediaElementWebAudio;
	module.exports = exports.default;

	/***/ }),

	/***/ "./src/mediaelement.js":
	/*!*****************************!*\
	  !*** ./src/mediaelement.js ***!
	  \*****************************/
	/***/ ((module, exports, __webpack_require__) => {


	function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

	Object.defineProperty(exports, "__esModule", ({
	  value: true
	}));
	exports["default"] = void 0;

	var _webaudio = _interopRequireDefault(__webpack_require__(/*! ./webaudio */ "./src/webaudio.js"));

	var util = _interopRequireWildcard(__webpack_require__(/*! ./util */ "./src/util/index.js"));

	function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

	function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

	function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

	function _get() { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(arguments.length < 3 ? target : receiver); } return desc.value; }; } return _get.apply(this, arguments); }

	function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }

	function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

	function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

	function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

	function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

	function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

	function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

	/**
	 * MediaElement backend
	 */
	var MediaElement = /*#__PURE__*/function (_WebAudio) {
	  _inherits(MediaElement, _WebAudio);

	  var _super = _createSuper(MediaElement);

	  /**
	   * Construct the backend
	   *
	   * @param {WavesurferParams} params Wavesurfer parameters
	   */
	  function MediaElement(params) {
	    var _this;

	    _classCallCheck(this, MediaElement);

	    _this = _super.call(this, params);
	    /** @private */

	    _this.params = params;
	    /**
	     * Initially a dummy media element to catch errors. Once `_load` is
	     * called, this will contain the actual `HTMLMediaElement`.
	     * @private
	     */

	    _this.media = {
	      currentTime: 0,
	      duration: 0,
	      paused: true,
	      playbackRate: 1,
	      play: function play() {},
	      pause: function pause() {},
	      volume: 0
	    };
	    /** @private */

	    _this.mediaType = params.mediaType.toLowerCase();
	    /** @private */

	    _this.elementPosition = params.elementPosition;
	    /** @private */

	    _this.peaks = null;
	    /** @private */

	    _this.playbackRate = 1;
	    /** @private */

	    _this.volume = 1;
	    /** @private */

	    _this.isMuted = false;
	    /** @private */

	    _this.buffer = null;
	    /** @private */

	    _this.onPlayEnd = null;
	    /** @private */

	    _this.mediaListeners = {};
	    return _this;
	  }
	  /**
	   * Initialise the backend, called in `wavesurfer.createBackend()`
	   */


	  _createClass(MediaElement, [{
	    key: "init",
	    value: function init() {
	      this.setPlaybackRate(this.params.audioRate);
	      this.createTimer();
	    }
	    /**
	     * Attach event listeners to media element.
	     */

	  }, {
	    key: "_setupMediaListeners",
	    value: function _setupMediaListeners() {
	      var _this2 = this;

	      this.mediaListeners.error = function () {
	        _this2.fireEvent('error', 'Error loading media element');
	      };

	      this.mediaListeners.canplay = function () {
	        _this2.fireEvent('canplay');
	      };

	      this.mediaListeners.ended = function () {
	        _this2.fireEvent('finish');
	      }; // listen to and relay play, pause and seeked events to enable
	      // playback control from the external media element


	      this.mediaListeners.play = function () {
	        _this2.fireEvent('play');
	      };

	      this.mediaListeners.pause = function () {
	        _this2.fireEvent('pause');
	      };

	      this.mediaListeners.seeked = function (event) {
	        _this2.fireEvent('seek');
	      };

	      this.mediaListeners.volumechange = function (event) {
	        _this2.isMuted = _this2.media.muted;

	        if (_this2.isMuted) {
	          _this2.volume = 0;
	        } else {
	          _this2.volume = _this2.media.volume;
	        }

	        _this2.fireEvent('volume');
	      }; // reset event listeners


	      Object.keys(this.mediaListeners).forEach(function (id) {
	        _this2.media.removeEventListener(id, _this2.mediaListeners[id]);

	        _this2.media.addEventListener(id, _this2.mediaListeners[id]);
	      });
	    }
	    /**
	     * Create a timer to provide a more precise `audioprocess` event.
	     */

	  }, {
	    key: "createTimer",
	    value: function createTimer() {
	      var _this3 = this;

	      var onAudioProcess = function onAudioProcess() {
	        if (_this3.isPaused()) {
	          return;
	        }

	        _this3.fireEvent('audioprocess', _this3.getCurrentTime()); // Call again in the next frame


	        util.frame(onAudioProcess)();
	      };

	      this.on('play', onAudioProcess); // Update the progress one more time to prevent it from being stuck in
	      // case of lower framerates

	      this.on('pause', function () {
	        _this3.fireEvent('audioprocess', _this3.getCurrentTime());
	      });
	    }
	    /**
	     * Create media element with url as its source,
	     * and append to container element.
	     *
	     * @param {string} url Path to media file
	     * @param {HTMLElement} container HTML element
	     * @param {number[]|Number.<Array[]>} peaks Array of peak data
	     * @param {string} preload HTML 5 preload attribute value
	     * @throws Will throw an error if the `url` argument is not a valid media
	     * element.
	     */

	  }, {
	    key: "load",
	    value: function load(url, container, peaks, preload) {
	      var media = document.createElement(this.mediaType);
	      media.controls = this.params.mediaControls;
	      media.autoplay = this.params.autoplay || false;
	      media.preload = preload == null ? 'auto' : preload;
	      media.src = url;
	      media.style.width = '100%';
	      var prevMedia = container.querySelector(this.mediaType);

	      if (prevMedia) {
	        container.removeChild(prevMedia);
	      }

	      container.appendChild(media);

	      this._load(media, peaks, preload);
	    }
	    /**
	     * Load existing media element.
	     *
	     * @param {HTMLMediaElement} elt HTML5 Audio or Video element
	     * @param {number[]|Number.<Array[]>} peaks Array of peak data
	     */

	  }, {
	    key: "loadElt",
	    value: function loadElt(elt, peaks) {
	      elt.controls = this.params.mediaControls;
	      elt.autoplay = this.params.autoplay || false;

	      this._load(elt, peaks, elt.preload);
	    }
	    /**
	     * Method called by both `load` (from url)
	     * and `loadElt` (existing media element) methods.
	     *
	     * @param {HTMLMediaElement} media HTML5 Audio or Video element
	     * @param {number[]|Number.<Array[]>} peaks Array of peak data
	     * @param {string} preload HTML 5 preload attribute value
	     * @throws Will throw an error if the `media` argument is not a valid media
	     * element.
	     * @private
	     */

	  }, {
	    key: "_load",
	    value: function _load(media, peaks, preload) {
	      // verify media element is valid
	      if (!(media instanceof HTMLMediaElement) || typeof media.addEventListener === 'undefined') {
	        throw new Error('media parameter is not a valid media element');
	      } // load must be called manually on iOS, otherwise peaks won't draw
	      // until a user interaction triggers load --> 'ready' event
	      //
	      // note that we avoid calling media.load here when given peaks and preload == 'none'
	      // as this almost always triggers some browser fetch of the media.


	      if (typeof media.load == 'function' && !(peaks && preload == 'none')) {
	        // Resets the media element and restarts the media resource. Any
	        // pending events are discarded. How much media data is fetched is
	        // still affected by the preload attribute.
	        media.load();
	      }

	      this.media = media;

	      this._setupMediaListeners();

	      this.peaks = peaks;
	      this.onPlayEnd = null;
	      this.buffer = null;
	      this.isMuted = media.muted;
	      this.setPlaybackRate(this.playbackRate);
	      this.setVolume(this.volume);
	    }
	    /**
	     * Used by `wavesurfer.isPlaying()` and `wavesurfer.playPause()`
	     *
	     * @return {boolean} Media paused or not
	     */

	  }, {
	    key: "isPaused",
	    value: function isPaused() {
	      return !this.media || this.media.paused;
	    }
	    /**
	     * Used by `wavesurfer.getDuration()`
	     *
	     * @return {number} Duration
	     */

	  }, {
	    key: "getDuration",
	    value: function getDuration() {
	      if (this.explicitDuration) {
	        return this.explicitDuration;
	      }

	      var duration = (this.buffer || this.media).duration;

	      if (duration >= Infinity) {
	        // streaming audio
	        duration = this.media.seekable.end(0);
	      }

	      return duration;
	    }
	    /**
	     * Returns the current time in seconds relative to the audio-clip's
	     * duration.
	     *
	     * @return {number} Current time
	     */

	  }, {
	    key: "getCurrentTime",
	    value: function getCurrentTime() {
	      return this.media && this.media.currentTime;
	    }
	    /**
	     * Get the position from 0 to 1
	     *
	     * @return {number} Current position
	     */

	  }, {
	    key: "getPlayedPercents",
	    value: function getPlayedPercents() {
	      return this.getCurrentTime() / this.getDuration() || 0;
	    }
	    /**
	     * Get the audio source playback rate.
	     *
	     * @return {number} Playback rate
	     */

	  }, {
	    key: "getPlaybackRate",
	    value: function getPlaybackRate() {
	      return this.playbackRate || this.media.playbackRate;
	    }
	    /**
	     * Set the audio source playback rate.
	     *
	     * @param {number} value Playback rate
	     */

	  }, {
	    key: "setPlaybackRate",
	    value: function setPlaybackRate(value) {
	      this.playbackRate = value || 1;
	      this.media.playbackRate = this.playbackRate;
	    }
	    /**
	     * Used by `wavesurfer.seekTo()`
	     *
	     * @param {number} start Position to start at in seconds
	     */

	  }, {
	    key: "seekTo",
	    value: function seekTo(start) {
	      if (start != null && !isNaN(start)) {
	        this.media.currentTime = start;
	      }

	      this.clearPlayEnd();
	    }
	    /**
	     * Plays the loaded audio region.
	     *
	     * @param {number} start Start offset in seconds, relative to the beginning
	     * of a clip.
	     * @param {number} end When to stop, relative to the beginning of a clip.
	     * @emits MediaElement#play
	     * @return {Promise} Result
	     */

	  }, {
	    key: "play",
	    value: function play(start, end) {
	      this.seekTo(start);
	      var promise = this.media.play();
	      end && this.setPlayEnd(end);
	      return promise;
	    }
	    /**
	     * Pauses the loaded audio.
	     *
	     * @emits MediaElement#pause
	     * @return {Promise} Result
	     */

	  }, {
	    key: "pause",
	    value: function pause() {
	      var promise;

	      if (this.media) {
	        promise = this.media.pause();
	      }

	      this.clearPlayEnd();
	      return promise;
	    }
	    /**
	     * Set the play end
	     *
	     * @param {number} end Where to end
	     */

	  }, {
	    key: "setPlayEnd",
	    value: function setPlayEnd(end) {
	      var _this4 = this;

	      this.clearPlayEnd();

	      this._onPlayEnd = function (time) {
	        if (time >= end) {
	          _this4.pause();

	          _this4.seekTo(end);
	        }
	      };

	      this.on('audioprocess', this._onPlayEnd);
	    }
	    /** @private */

	  }, {
	    key: "clearPlayEnd",
	    value: function clearPlayEnd() {
	      if (this._onPlayEnd) {
	        this.un('audioprocess', this._onPlayEnd);
	        this._onPlayEnd = null;
	      }
	    }
	    /**
	     * Compute the max and min value of the waveform when broken into
	     * <length> subranges.
	     *
	     * @param {number} length How many subranges to break the waveform into.
	     * @param {number} first First sample in the required range.
	     * @param {number} last Last sample in the required range.
	     * @return {number[]|Number.<Array[]>} Array of 2*<length> peaks or array of
	     * arrays of peaks consisting of (max, min) values for each subrange.
	     */

	  }, {
	    key: "getPeaks",
	    value: function getPeaks(length, first, last) {
	      if (this.buffer) {
	        return _get(_getPrototypeOf(MediaElement.prototype), "getPeaks", this).call(this, length, first, last);
	      }

	      return this.peaks || [];
	    }
	    /**
	     * Set the sink id for the media player
	     *
	     * @param {string} deviceId String value representing audio device id.
	     * @returns {Promise} A Promise that resolves to `undefined` when there
	     * are no errors.
	     */

	  }, {
	    key: "setSinkId",
	    value: function setSinkId(deviceId) {
	      if (deviceId) {
	        if (!this.media.setSinkId) {
	          return Promise.reject(new Error('setSinkId is not supported in your browser'));
	        }

	        return this.media.setSinkId(deviceId);
	      }

	      return Promise.reject(new Error('Invalid deviceId: ' + deviceId));
	    }
	    /**
	     * Get the current volume
	     *
	     * @return {number} value A floating point value between 0 and 1.
	     */

	  }, {
	    key: "getVolume",
	    value: function getVolume() {
	      return this.volume;
	    }
	    /**
	     * Set the audio volume
	     *
	     * @param {number} value A floating point value between 0 and 1.
	     */

	  }, {
	    key: "setVolume",
	    value: function setVolume(value) {
	      this.volume = value; // no need to change when it's already at that volume

	      if (this.media.volume !== this.volume) {
	        this.media.volume = this.volume;
	      }
	    }
	    /**
	     * Enable or disable muted audio
	     *
	     * @since 4.0.0
	     * @param {boolean} muted Specify `true` to mute audio.
	     */

	  }, {
	    key: "setMute",
	    value: function setMute(muted) {
	      // This causes a volume change to be emitted too through the
	      // volumechange event listener.
	      this.isMuted = this.media.muted = muted;
	    }
	    /**
	     * This is called when wavesurfer is destroyed
	     *
	     */

	  }, {
	    key: "destroy",
	    value: function destroy() {
	      var _this5 = this;

	      this.pause();
	      this.unAll();
	      this.destroyed = true; // cleanup media event listeners

	      Object.keys(this.mediaListeners).forEach(function (id) {
	        if (_this5.media) {
	          _this5.media.removeEventListener(id, _this5.mediaListeners[id]);
	        }
	      });

	      if (this.params.removeMediaElementOnDestroy && this.media && this.media.parentNode) {
	        this.media.parentNode.removeChild(this.media);
	      }

	      this.media = null;
	    }
	  }]);

	  return MediaElement;
	}(_webaudio.default);

	exports["default"] = MediaElement;
	module.exports = exports.default;

	/***/ }),

	/***/ "./src/peakcache.js":
	/*!**************************!*\
	  !*** ./src/peakcache.js ***!
	  \**************************/
	/***/ ((module, exports) => {


	Object.defineProperty(exports, "__esModule", ({
	  value: true
	}));
	exports["default"] = void 0;

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

	function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

	/**
	 * Caches the decoded peaks data to improve rendering speed for large audio
	 *
	 * Is used if the option parameter `partialRender` is set to `true`
	 */
	var PeakCache = /*#__PURE__*/function () {
	  /**
	   * Instantiate cache
	   */
	  function PeakCache() {
	    _classCallCheck(this, PeakCache);

	    this.clearPeakCache();
	  }
	  /**
	   * Empty the cache
	   */


	  _createClass(PeakCache, [{
	    key: "clearPeakCache",
	    value: function clearPeakCache() {
	      /**
	       * Flat array with entries that are always in pairs to mark the
	       * beginning and end of each subrange.  This is a convenience so we can
	       * iterate over the pairs for easy set difference operations.
	       * @private
	       */
	      this.peakCacheRanges = [];
	      /**
	       * Length of the entire cachable region, used for resetting the cache
	       * when this changes (zoom events, for instance).
	       * @private
	       */

	      this.peakCacheLength = -1;
	    }
	    /**
	     * Add a range of peaks to the cache
	     *
	     * @param {number} length The length of the range
	     * @param {number} start The x offset of the start of the range
	     * @param {number} end The x offset of the end of the range
	     * @return {Number.<Array[]>} Array with arrays of numbers
	     */

	  }, {
	    key: "addRangeToPeakCache",
	    value: function addRangeToPeakCache(length, start, end) {
	      if (length != this.peakCacheLength) {
	        this.clearPeakCache();
	        this.peakCacheLength = length;
	      } // Return ranges that weren't in the cache before the call.


	      var uncachedRanges = [];
	      var i = 0; // Skip ranges before the current start.

	      while (i < this.peakCacheRanges.length && this.peakCacheRanges[i] < start) {
	        i++;
	      } // If |i| is even, |start| falls after an existing range.  Otherwise,
	      // |start| falls between an existing range, and the uncached region
	      // starts when we encounter the next node in |peakCacheRanges| or
	      // |end|, whichever comes first.


	      if (i % 2 == 0) {
	        uncachedRanges.push(start);
	      }

	      while (i < this.peakCacheRanges.length && this.peakCacheRanges[i] <= end) {
	        uncachedRanges.push(this.peakCacheRanges[i]);
	        i++;
	      } // If |i| is even, |end| is after all existing ranges.


	      if (i % 2 == 0) {
	        uncachedRanges.push(end);
	      } // Filter out the 0-length ranges.


	      uncachedRanges = uncachedRanges.filter(function (item, pos, arr) {
	        if (pos == 0) {
	          return item != arr[pos + 1];
	        } else if (pos == arr.length - 1) {
	          return item != arr[pos - 1];
	        }

	        return item != arr[pos - 1] && item != arr[pos + 1];
	      }); // Merge the two ranges together, uncachedRanges will either contain
	      // wholly new points, or duplicates of points in peakCacheRanges.  If
	      // duplicates are detected, remove both and extend the range.

	      this.peakCacheRanges = this.peakCacheRanges.concat(uncachedRanges);
	      this.peakCacheRanges = this.peakCacheRanges.sort(function (a, b) {
	        return a - b;
	      }).filter(function (item, pos, arr) {
	        if (pos == 0) {
	          return item != arr[pos + 1];
	        } else if (pos == arr.length - 1) {
	          return item != arr[pos - 1];
	        }

	        return item != arr[pos - 1] && item != arr[pos + 1];
	      }); // Push the uncached ranges into an array of arrays for ease of
	      // iteration in the functions that call this.

	      var uncachedRangePairs = [];

	      for (i = 0; i < uncachedRanges.length; i += 2) {
	        uncachedRangePairs.push([uncachedRanges[i], uncachedRanges[i + 1]]);
	      }

	      return uncachedRangePairs;
	    }
	    /**
	     * For testing
	     *
	     * @return {Number.<Array[]>} Array with arrays of numbers
	     */

	  }, {
	    key: "getCacheRanges",
	    value: function getCacheRanges() {
	      var peakCacheRangePairs = [];
	      var i;

	      for (i = 0; i < this.peakCacheRanges.length; i += 2) {
	        peakCacheRangePairs.push([this.peakCacheRanges[i], this.peakCacheRanges[i + 1]]);
	      }

	      return peakCacheRangePairs;
	    }
	  }]);

	  return PeakCache;
	}();

	exports["default"] = PeakCache;
	module.exports = exports.default;

	/***/ }),

	/***/ "./src/util/absMax.js":
	/*!****************************!*\
	  !*** ./src/util/absMax.js ***!
	  \****************************/
	/***/ ((module, exports, __webpack_require__) => {


	Object.defineProperty(exports, "__esModule", ({
	  value: true
	}));
	exports["default"] = absMax;

	var _max = _interopRequireDefault(__webpack_require__(/*! ./max */ "./src/util/max.js"));

	var _min = _interopRequireDefault(__webpack_require__(/*! ./min */ "./src/util/min.js"));

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	/**
	 * Get the largest absolute value in an array
	 *
	 * @param   {Array} values Array of numbers
	 * @returns {Number} Largest number found
	 * @example console.log(max([-3, 2, 1]), max([-3, 2, 4])); // logs 3 4
	 * @since 4.3.0
	 */
	function absMax(values) {
	  var max = (0, _max.default)(values);
	  var min = (0, _min.default)(values);
	  return -min > max ? -min : max;
	}

	module.exports = exports.default;

	/***/ }),

	/***/ "./src/util/clamp.js":
	/*!***************************!*\
	  !*** ./src/util/clamp.js ***!
	  \***************************/
	/***/ ((module, exports) => {


	Object.defineProperty(exports, "__esModule", ({
	  value: true
	}));
	exports["default"] = clamp;

	/**
	 * Returns a number limited to the given range.
	 *
	 * @param {number} val The number to be limited to a range
	 * @param {number} min The lower boundary of the limit range
	 * @param {number} max The upper boundary of the limit range
	 * @returns {number} A number in the range [min, max]
	 */
	function clamp(val, min, max) {
	  return Math.min(Math.max(min, val), max);
	}

	module.exports = exports.default;

	/***/ }),

	/***/ "./src/util/fetch.js":
	/*!***************************!*\
	  !*** ./src/util/fetch.js ***!
	  \***************************/
	/***/ ((module, exports, __webpack_require__) => {


	Object.defineProperty(exports, "__esModule", ({
	  value: true
	}));
	exports["default"] = fetchFile;

	var _observer = _interopRequireDefault(__webpack_require__(/*! ./observer */ "./src/util/observer.js"));

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

	function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

	var ProgressHandler = /*#__PURE__*/function () {
	  /**
	   * Instantiate ProgressHandler
	   *
	   * @param {Observer} instance The `fetchFile` observer instance.
	   * @param {Number} contentLength Content length.
	   * @param {Response} response Response object.
	   */
	  function ProgressHandler(instance, contentLength, response) {
	    _classCallCheck(this, ProgressHandler);

	    this.instance = instance;
	    this.instance._reader = response.body.getReader();
	    this.total = parseInt(contentLength, 10);
	    this.loaded = 0;
	  }
	  /**
	   * A method that is called once, immediately after the `ReadableStream``
	   * is constructed.
	   *
	   * @param {ReadableStreamDefaultController} controller Controller instance
	   *     used to control the stream.
	   */


	  _createClass(ProgressHandler, [{
	    key: "start",
	    value: function start(controller) {
	      var _this = this;

	      var read = function read() {
	        // instance._reader.read() returns a promise that resolves
	        // when a value has been received
	        _this.instance._reader.read().then(function (_ref) {
	          var done = _ref.done,
	              value = _ref.value;

	          // result objects contain two properties:
	          // done  - true if the stream has already given you all its data.
	          // value - some data. Always undefined when done is true.
	          if (done) {
	            // ensure onProgress called when content-length=0
	            if (_this.total === 0) {
	              _this.instance.onProgress.call(_this.instance, {
	                loaded: _this.loaded,
	                total: _this.total,
	                lengthComputable: false
	              });
	            } // no more data needs to be consumed, close the stream


	            controller.close();
	            return;
	          }

	          _this.loaded += value.byteLength;

	          _this.instance.onProgress.call(_this.instance, {
	            loaded: _this.loaded,
	            total: _this.total,
	            lengthComputable: !(_this.total === 0)
	          }); // enqueue the next data chunk into our target stream


	          controller.enqueue(value);
	          read();
	        }).catch(function (error) {
	          controller.error(error);
	        });
	      };

	      read();
	    }
	  }]);

	  return ProgressHandler;
	}();
	/**
	 * Load a file using `fetch`.
	 *
	 * @param {object} options Request options to use. See example below.
	 * @returns {Observer} Observer instance
	 * @example
	 * // default options
	 * let options = {
	 *     url: undefined,
	 *     method: 'GET',
	 *     mode: 'cors',
	 *     credentials: 'same-origin',
	 *     cache: 'default',
	 *     responseType: 'json',
	 *     requestHeaders: [],
	 *     redirect: 'follow',
	 *     referrer: 'client'
	 * };
	 *
	 * // override some options
	 * options.url = '../media/demo.wav';

	 * // available types: 'arraybuffer', 'blob', 'json' or 'text'
	 * options.responseType = 'arraybuffer';
	 *
	 * // make fetch call
	 * let request = util.fetchFile(options);
	 *
	 * // listen for events
	 * request.on('progress', e => {
	 *     console.log('progress', e);
	 * });
	 *
	 * request.on('success', data => {
	 *     console.log('success!', data);
	 * });
	 *
	 * request.on('error', e => {
	 *     console.warn('fetchFile error: ', e);
	 * });
	 */


	function fetchFile(options) {
	  if (!options) {
	    throw new Error('fetch options missing');
	  } else if (!options.url) {
	    throw new Error('fetch url missing');
	  }

	  var instance = new _observer.default();
	  var fetchHeaders = new Headers();
	  var fetchRequest = new Request(options.url); // add ability to abort

	  instance.controller = new AbortController(); // check if headers have to be added

	  if (options && options.requestHeaders) {
	    // add custom request headers
	    options.requestHeaders.forEach(function (header) {
	      fetchHeaders.append(header.key, header.value);
	    });
	  } // parse fetch options


	  var responseType = options.responseType || 'json';
	  var fetchOptions = {
	    method: options.method || 'GET',
	    headers: fetchHeaders,
	    mode: options.mode || 'cors',
	    credentials: options.credentials || 'same-origin',
	    cache: options.cache || 'default',
	    redirect: options.redirect || 'follow',
	    referrer: options.referrer || 'client',
	    signal: instance.controller.signal
	  };
	  fetch(fetchRequest, fetchOptions).then(function (response) {
	    // store response reference
	    instance.response = response;
	    var progressAvailable = true;

	    if (!response.body) {
	      // ReadableStream is not yet supported in this browser
	      // see https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream
	      progressAvailable = false;
	    } // Server must send CORS header "Access-Control-Expose-Headers: content-length"


	    var contentLength = response.headers.get('content-length');

	    if (contentLength === null) {
	      // Content-Length server response header missing.
	      // Don't evaluate download progress if we can't compare against a total size
	      // see https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#Access-Control-Expose-Headers
	      progressAvailable = false;
	    }

	    if (!progressAvailable) {
	      // not able to check download progress so skip it
	      return response;
	    } // fire progress event when during load


	    instance.onProgress = function (e) {
	      instance.fireEvent('progress', e);
	    };

	    return new Response(new ReadableStream(new ProgressHandler(instance, contentLength, response)), fetchOptions);
	  }).then(function (response) {
	    var errMsg;

	    if (response.ok) {
	      switch (responseType) {
	        case 'arraybuffer':
	          return response.arrayBuffer();

	        case 'json':
	          return response.json();

	        case 'blob':
	          return response.blob();

	        case 'text':
	          return response.text();

	        default:
	          errMsg = 'Unknown responseType: ' + responseType;
	          break;
	      }
	    }

	    if (!errMsg) {
	      errMsg = 'HTTP error status: ' + response.status;
	    }

	    throw new Error(errMsg);
	  }).then(function (response) {
	    instance.fireEvent('success', response);
	  }).catch(function (error) {
	    instance.fireEvent('error', error);
	  }); // return the fetch request

	  instance.fetchRequest = fetchRequest;
	  return instance;
	}

	module.exports = exports.default;

	/***/ }),

	/***/ "./src/util/frame.js":
	/*!***************************!*\
	  !*** ./src/util/frame.js ***!
	  \***************************/
	/***/ ((module, exports, __webpack_require__) => {


	Object.defineProperty(exports, "__esModule", ({
	  value: true
	}));
	exports["default"] = frame;

	var _requestAnimationFrame = _interopRequireDefault(__webpack_require__(/*! ./request-animation-frame */ "./src/util/request-animation-frame.js"));

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	/**
	 * Create a function which will be called at the next requestAnimationFrame
	 * cycle
	 *
	 * @param {function} func The function to call
	 *
	 * @return {func} The function wrapped within a requestAnimationFrame
	 */
	function frame(func) {
	  return function () {
	    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
	      args[_key] = arguments[_key];
	    }

	    return (0, _requestAnimationFrame.default)(function () {
	      return func.apply(void 0, args);
	    });
	  };
	}

	module.exports = exports.default;

	/***/ }),

	/***/ "./src/util/get-id.js":
	/*!****************************!*\
	  !*** ./src/util/get-id.js ***!
	  \****************************/
	/***/ ((module, exports) => {


	Object.defineProperty(exports, "__esModule", ({
	  value: true
	}));
	exports["default"] = getId;

	/**
	 * Get a random prefixed ID
	 *
	 * @param {String} prefix Prefix to use. Default is `'wavesurfer_'`.
	 * @returns {String} Random prefixed ID
	 * @example
	 * console.log(getId()); // logs 'wavesurfer_b5pors4ru6g'
	 *
	 * let prefix = 'foo-';
	 * console.log(getId(prefix)); // logs 'foo-b5pors4ru6g'
	 */
	function getId(prefix) {
	  if (prefix === undefined) {
	    prefix = 'wavesurfer_';
	  }

	  return prefix + Math.random().toString(32).substring(2);
	}

	module.exports = exports.default;

	/***/ }),

	/***/ "./src/util/index.js":
	/*!***************************!*\
	  !*** ./src/util/index.js ***!
	  \***************************/
	/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


	Object.defineProperty(exports, "__esModule", ({
	  value: true
	}));
	Object.defineProperty(exports, "Observer", ({
	  enumerable: true,
	  get: function get() {
	    return _observer.default;
	  }
	}));
	Object.defineProperty(exports, "absMax", ({
	  enumerable: true,
	  get: function get() {
	    return _absMax.default;
	  }
	}));
	Object.defineProperty(exports, "clamp", ({
	  enumerable: true,
	  get: function get() {
	    return _clamp.default;
	  }
	}));
	Object.defineProperty(exports, "debounce", ({
	  enumerable: true,
	  get: function get() {
	    return _debounce.default;
	  }
	}));
	Object.defineProperty(exports, "fetchFile", ({
	  enumerable: true,
	  get: function get() {
	    return _fetch.default;
	  }
	}));
	Object.defineProperty(exports, "frame", ({
	  enumerable: true,
	  get: function get() {
	    return _frame.default;
	  }
	}));
	Object.defineProperty(exports, "getId", ({
	  enumerable: true,
	  get: function get() {
	    return _getId.default;
	  }
	}));
	Object.defineProperty(exports, "ignoreSilenceMode", ({
	  enumerable: true,
	  get: function get() {
	    return _silenceMode.default;
	  }
	}));
	Object.defineProperty(exports, "max", ({
	  enumerable: true,
	  get: function get() {
	    return _max.default;
	  }
	}));
	Object.defineProperty(exports, "min", ({
	  enumerable: true,
	  get: function get() {
	    return _min.default;
	  }
	}));
	Object.defineProperty(exports, "preventClick", ({
	  enumerable: true,
	  get: function get() {
	    return _preventClick.default;
	  }
	}));
	Object.defineProperty(exports, "requestAnimationFrame", ({
	  enumerable: true,
	  get: function get() {
	    return _requestAnimationFrame.default;
	  }
	}));
	Object.defineProperty(exports, "style", ({
	  enumerable: true,
	  get: function get() {
	    return _style.default;
	  }
	}));
	Object.defineProperty(exports, "withOrientation", ({
	  enumerable: true,
	  get: function get() {
	    return _orientation.default;
	  }
	}));

	var _getId = _interopRequireDefault(__webpack_require__(/*! ./get-id */ "./src/util/get-id.js"));

	var _max = _interopRequireDefault(__webpack_require__(/*! ./max */ "./src/util/max.js"));

	var _min = _interopRequireDefault(__webpack_require__(/*! ./min */ "./src/util/min.js"));

	var _absMax = _interopRequireDefault(__webpack_require__(/*! ./absMax */ "./src/util/absMax.js"));

	var _observer = _interopRequireDefault(__webpack_require__(/*! ./observer */ "./src/util/observer.js"));

	var _style = _interopRequireDefault(__webpack_require__(/*! ./style */ "./src/util/style.js"));

	var _requestAnimationFrame = _interopRequireDefault(__webpack_require__(/*! ./request-animation-frame */ "./src/util/request-animation-frame.js"));

	var _frame = _interopRequireDefault(__webpack_require__(/*! ./frame */ "./src/util/frame.js"));

	var _debounce = _interopRequireDefault(__webpack_require__(/*! debounce */ "./node_modules/debounce/index.js"));

	var _preventClick = _interopRequireDefault(__webpack_require__(/*! ./prevent-click */ "./src/util/prevent-click.js"));

	var _fetch = _interopRequireDefault(__webpack_require__(/*! ./fetch */ "./src/util/fetch.js"));

	var _clamp = _interopRequireDefault(__webpack_require__(/*! ./clamp */ "./src/util/clamp.js"));

	var _orientation = _interopRequireDefault(__webpack_require__(/*! ./orientation */ "./src/util/orientation.js"));

	var _silenceMode = _interopRequireDefault(__webpack_require__(/*! ./silence-mode */ "./src/util/silence-mode.js"));

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	/***/ }),

	/***/ "./src/util/max.js":
	/*!*************************!*\
	  !*** ./src/util/max.js ***!
	  \*************************/
	/***/ ((module, exports) => {


	Object.defineProperty(exports, "__esModule", ({
	  value: true
	}));
	exports["default"] = max;

	/**
	 * Get the largest value
	 *
	 * @param   {Array} values Array of numbers
	 * @returns {Number} Largest number found
	 * @example console.log(max([1, 2, 3])); // logs 3
	 */
	function max(values) {
	  var largest = -Infinity;
	  Object.keys(values).forEach(function (i) {
	    if (values[i] > largest) {
	      largest = values[i];
	    }
	  });
	  return largest;
	}

	module.exports = exports.default;

	/***/ }),

	/***/ "./src/util/min.js":
	/*!*************************!*\
	  !*** ./src/util/min.js ***!
	  \*************************/
	/***/ ((module, exports) => {


	Object.defineProperty(exports, "__esModule", ({
	  value: true
	}));
	exports["default"] = min;

	/**
	 * Get the smallest value
	 *
	 * @param   {Array} values Array of numbers
	 * @returns {Number} Smallest number found
	 * @example console.log(min([1, 2, 3])); // logs 1
	 */
	function min(values) {
	  var smallest = Number(Infinity);
	  Object.keys(values).forEach(function (i) {
	    if (values[i] < smallest) {
	      smallest = values[i];
	    }
	  });
	  return smallest;
	}

	module.exports = exports.default;

	/***/ }),

	/***/ "./src/util/observer.js":
	/*!******************************!*\
	  !*** ./src/util/observer.js ***!
	  \******************************/
	/***/ ((module, exports) => {


	Object.defineProperty(exports, "__esModule", ({
	  value: true
	}));
	exports["default"] = void 0;

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

	function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

	/**
	 * @typedef {Object} ListenerDescriptor
	 * @property {string} name The name of the event
	 * @property {function} callback The callback
	 * @property {function} un The function to call to remove the listener
	 */

	/**
	 * Observer class
	 */
	var Observer = /*#__PURE__*/function () {
	  /**
	   * Instantiate Observer
	   */
	  function Observer() {
	    _classCallCheck(this, Observer);

	    /**
	     * @private
	     * @todo Initialise the handlers here already and remove the conditional
	     * assignment in `on()`
	     */
	    this._disabledEventEmissions = [];
	    this.handlers = null;
	  }
	  /**
	   * Attach a handler function for an event.
	   *
	   * @param {string} event Name of the event to listen to
	   * @param {function} fn The callback to trigger when the event is fired
	   * @return {ListenerDescriptor} The event descriptor
	   */


	  _createClass(Observer, [{
	    key: "on",
	    value: function on(event, fn) {
	      var _this = this;

	      if (!this.handlers) {
	        this.handlers = {};
	      }

	      var handlers = this.handlers[event];

	      if (!handlers) {
	        handlers = this.handlers[event] = [];
	      }

	      handlers.push(fn); // Return an event descriptor

	      return {
	        name: event,
	        callback: fn,
	        un: function un(e, fn) {
	          return _this.un(e, fn);
	        }
	      };
	    }
	    /**
	     * Remove an event handler.
	     *
	     * @param {string} event Name of the event the listener that should be
	     * removed listens to
	     * @param {function} fn The callback that should be removed
	     */

	  }, {
	    key: "un",
	    value: function un(event, fn) {
	      if (!this.handlers) {
	        return;
	      }

	      var handlers = this.handlers[event];
	      var i;

	      if (handlers) {
	        if (fn) {
	          for (i = handlers.length - 1; i >= 0; i--) {
	            if (handlers[i] == fn) {
	              handlers.splice(i, 1);
	            }
	          }
	        } else {
	          handlers.length = 0;
	        }
	      }
	    }
	    /**
	     * Remove all event handlers.
	     */

	  }, {
	    key: "unAll",
	    value: function unAll() {
	      this.handlers = null;
	    }
	    /**
	     * Attach a handler to an event. The handler is executed at most once per
	     * event type.
	     *
	     * @param {string} event The event to listen to
	     * @param {function} handler The callback that is only to be called once
	     * @return {ListenerDescriptor} The event descriptor
	     */

	  }, {
	    key: "once",
	    value: function once(event, handler) {
	      var _this2 = this;

	      var fn = function fn() {
	        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
	          args[_key] = arguments[_key];
	        }

	        /*  eslint-disable no-invalid-this */
	        handler.apply(_this2, args);
	        /*  eslint-enable no-invalid-this */

	        setTimeout(function () {
	          _this2.un(event, fn);
	        }, 0);
	      };

	      return this.on(event, fn);
	    }
	    /**
	     * Disable firing a list of events by name. When specified, event handlers for any event type
	     * passed in here will not be called.
	     *
	     * @since 4.0.0
	     * @param {string[]} eventNames an array of event names to disable emissions for
	     * @example
	     * // disable seek and interaction events
	     * wavesurfer.setDisabledEventEmissions(['seek', 'interaction']);
	     */

	  }, {
	    key: "setDisabledEventEmissions",
	    value: function setDisabledEventEmissions(eventNames) {
	      this._disabledEventEmissions = eventNames;
	    }
	    /**
	     * plugins borrow part of this class without calling the constructor,
	     * so we have to be careful about _disabledEventEmissions
	     */

	  }, {
	    key: "_isDisabledEventEmission",
	    value: function _isDisabledEventEmission(event) {
	      return this._disabledEventEmissions && this._disabledEventEmissions.includes(event);
	    }
	    /**
	     * Manually fire an event
	     *
	     * @param {string} event The event to fire manually
	     * @param {...any} args The arguments with which to call the listeners
	     */

	  }, {
	    key: "fireEvent",
	    value: function fireEvent(event) {
	      for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
	        args[_key2 - 1] = arguments[_key2];
	      }

	      if (!this.handlers || this._isDisabledEventEmission(event)) {
	        return;
	      }

	      var handlers = this.handlers[event];
	      handlers && handlers.forEach(function (fn) {
	        fn.apply(void 0, args);
	      });
	    }
	  }]);

	  return Observer;
	}();

	exports["default"] = Observer;
	module.exports = exports.default;

	/***/ }),

	/***/ "./src/util/orientation.js":
	/*!*********************************!*\
	  !*** ./src/util/orientation.js ***!
	  \*********************************/
	/***/ ((module, exports) => {


	Object.defineProperty(exports, "__esModule", ({
	  value: true
	}));
	exports["default"] = withOrientation;
	var verticalPropMap = {
	  width: 'height',
	  height: 'width',
	  overflowX: 'overflowY',
	  overflowY: 'overflowX',
	  clientWidth: 'clientHeight',
	  clientHeight: 'clientWidth',
	  clientX: 'clientY',
	  clientY: 'clientX',
	  scrollWidth: 'scrollHeight',
	  scrollLeft: 'scrollTop',
	  offsetLeft: 'offsetTop',
	  offsetTop: 'offsetLeft',
	  offsetHeight: 'offsetWidth',
	  offsetWidth: 'offsetHeight',
	  left: 'top',
	  right: 'bottom',
	  top: 'left',
	  bottom: 'right',
	  borderRightStyle: 'borderBottomStyle',
	  borderRightWidth: 'borderBottomWidth',
	  borderRightColor: 'borderBottomColor'
	};
	/**
	 * Convert a horizontally-oriented property name to a vertical one.
	 *
	 * @param {string} prop A property name
	 * @param {bool} vertical Whether the element is oriented vertically
	 * @returns {string} prop, converted appropriately
	 */

	function mapProp(prop, vertical) {
	  if (Object.prototype.hasOwnProperty.call(verticalPropMap, prop)) {
	    return vertical ? verticalPropMap[prop] : prop;
	  } else {
	    return prop;
	  }
	}

	var isProxy = Symbol("isProxy");
	/**
	 * Returns an appropriately oriented object based on vertical.
	 * If vertical is true, attribute getting and setting will be mapped through
	 * verticalPropMap, so that e.g. getting the object's .width will give its
	 * .height instead.
	 * Certain methods of an oriented object will return oriented objects as well.
	 * Oriented objects can't be added to the DOM directly since they are Proxy objects
	 * and thus fail typechecks. Use domElement to get the actual element for this.
	 *
	 * @param {object} target The object to be wrapped and oriented
	 * @param {bool} vertical Whether the element is oriented vertically
	 * @returns {Proxy} An oriented object with attr translation via verticalAttrMap
	 * @since 5.0.0
	 */

	function withOrientation(target, vertical) {
	  if (target[isProxy]) {
	    return target;
	  } else {
	    return new Proxy(target, {
	      get: function get(obj, prop, receiver) {
	        if (prop === isProxy) {
	          return true;
	        } else if (prop === 'domElement') {
	          return obj;
	        } else if (prop === 'style') {
	          return withOrientation(obj.style, vertical);
	        } else if (prop === 'canvas') {
	          return withOrientation(obj.canvas, vertical);
	        } else if (prop === 'getBoundingClientRect') {
	          return function () {
	            return withOrientation(obj.getBoundingClientRect.apply(obj, arguments), vertical);
	          };
	        } else if (prop === 'getContext') {
	          return function () {
	            return withOrientation(obj.getContext.apply(obj, arguments), vertical);
	          };
	        } else {
	          var value = obj[mapProp(prop, vertical)];
	          return typeof value == 'function' ? value.bind(obj) : value;
	        }
	      },
	      set: function set(obj, prop, value) {
	        obj[mapProp(prop, vertical)] = value;
	        return true;
	      }
	    });
	  }
	}

	module.exports = exports.default;

	/***/ }),

	/***/ "./src/util/prevent-click.js":
	/*!***********************************!*\
	  !*** ./src/util/prevent-click.js ***!
	  \***********************************/
	/***/ ((module, exports) => {


	Object.defineProperty(exports, "__esModule", ({
	  value: true
	}));
	exports["default"] = preventClick;

	/**
	 * Stops propagation of click event and removes event listener
	 *
	 * @private
	 * @param {object} event The click event
	 */
	function preventClickHandler(event) {
	  event.stopPropagation();
	  document.body.removeEventListener('click', preventClickHandler, true);
	}
	/**
	 * Starts listening for click event and prevent propagation
	 *
	 * @param {object} values Values
	 */


	function preventClick(values) {
	  document.body.addEventListener('click', preventClickHandler, true);
	}

	module.exports = exports.default;

	/***/ }),

	/***/ "./src/util/request-animation-frame.js":
	/*!*********************************************!*\
	  !*** ./src/util/request-animation-frame.js ***!
	  \*********************************************/
	/***/ ((module, exports) => {


	Object.defineProperty(exports, "__esModule", ({
	  value: true
	}));
	exports["default"] = void 0;

	/* eslint-disable valid-jsdoc */

	/**
	 * Returns the `requestAnimationFrame` function for the browser, or a shim with
	 * `setTimeout` if the function is not found
	 *
	 * @return {function} Available `requestAnimationFrame` function for the browser
	 */
	var _default = (window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback, element) {
	  return setTimeout(callback, 1000 / 60);
	}).bind(window);

	exports["default"] = _default;
	module.exports = exports.default;

	/***/ }),

	/***/ "./src/util/silence-mode.js":
	/*!**********************************!*\
	  !*** ./src/util/silence-mode.js ***!
	  \**********************************/
	/***/ ((module, exports) => {


	Object.defineProperty(exports, "__esModule", ({
	  value: true
	}));
	exports["default"] = ignoreSilenceMode;

	/**
	 * Ignores device silence mode when using the `WebAudio` backend.
	 *
	 * Many mobile devices contain a hardware button to mute the ringtone for incoming
	 * calls and messages. Unfortunately, on some platforms like iOS, this also mutes
	 * wavesurfer's audio when using the `WebAudio` backend. This function creates a
	 * temporary `<audio>` element that makes sure the WebAudio backend keeps playing
	 * when muting the device ringer.
	 *
	 * @since 5.2.0
	 */
	function ignoreSilenceMode() {
	  // Set the src to a short bit of url encoded as a silent mp3
	  // NOTE The silence MP3 must be high quality, when web audio sounds are played
	  // in parallel the web audio sound is mixed to match the bitrate of the html sound
	  // 0.01 seconds of silence VBR220-260 Joint Stereo 859B
	  var audioData = "data:audio/mpeg;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA//////////////////////////////////////////////////////////////////8AAABhTEFNRTMuMTAwA8MAAAAAAAAAABQgJAUHQQAB9AAAAnGMHkkIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//sQxAADgnABGiAAQBCqgCRMAAgEAH///////////////7+n/9FTuQsQH//////2NG0jWUGlio5gLQTOtIoeR2WX////X4s9Atb/JRVCbBUpeRUq//////////////////9RUi0f2jn/+xDECgPCjAEQAABN4AAANIAAAAQVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ=="; // disable iOS Airplay (setting the attribute in js doesn't work)

	  var tmp = document.createElement("div");
	  tmp.innerHTML = '<audio x-webkit-airplay="deny"></audio>';
	  var audioSilentMode = tmp.children.item(0);
	  audioSilentMode.src = audioData;
	  audioSilentMode.preload = "auto";
	  audioSilentMode.type = "audio/mpeg";
	  audioSilentMode.disableRemotePlayback = true; // play

	  audioSilentMode.play(); // cleanup

	  audioSilentMode.remove();
	  tmp.remove();
	}

	module.exports = exports.default;

	/***/ }),

	/***/ "./src/util/style.js":
	/*!***************************!*\
	  !*** ./src/util/style.js ***!
	  \***************************/
	/***/ ((module, exports) => {


	Object.defineProperty(exports, "__esModule", ({
	  value: true
	}));
	exports["default"] = style;

	/**
	 * Apply a map of styles to an element
	 *
	 * @param {HTMLElement} el The element that the styles will be applied to
	 * @param {Object} styles The map of propName: attribute, both are used as-is
	 *
	 * @return {HTMLElement} el
	 */
	function style(el, styles) {
	  Object.keys(styles).forEach(function (prop) {
	    if (el.style[prop] !== styles[prop]) {
	      el.style[prop] = styles[prop];
	    }
	  });
	  return el;
	}

	module.exports = exports.default;

	/***/ }),

	/***/ "./src/wavesurfer.js":
	/*!***************************!*\
	  !*** ./src/wavesurfer.js ***!
	  \***************************/
	/***/ ((module, exports, __webpack_require__) => {


	function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

	Object.defineProperty(exports, "__esModule", ({
	  value: true
	}));
	exports["default"] = void 0;

	var util = _interopRequireWildcard(__webpack_require__(/*! ./util */ "./src/util/index.js"));

	var _drawer = _interopRequireDefault(__webpack_require__(/*! ./drawer.multicanvas */ "./src/drawer.multicanvas.js"));

	var _webaudio = _interopRequireDefault(__webpack_require__(/*! ./webaudio */ "./src/webaudio.js"));

	var _mediaelement = _interopRequireDefault(__webpack_require__(/*! ./mediaelement */ "./src/mediaelement.js"));

	var _peakcache = _interopRequireDefault(__webpack_require__(/*! ./peakcache */ "./src/peakcache.js"));

	var _mediaelementWebaudio = _interopRequireDefault(__webpack_require__(/*! ./mediaelement-webaudio */ "./src/mediaelement-webaudio.js"));

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

	function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }

	function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

	function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

	function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

	function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

	function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

	function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

	function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
	/**
	 * WaveSurfer core library class
	 *
	 * @extends {Observer}
	 * @example
	 * const params = {
	 *   container: '#waveform',
	 *   waveColor: 'violet',
	 *   progressColor: 'purple'
	 * };
	 *
	 * // initialise like this
	 * const wavesurfer = WaveSurfer.create(params);
	 *
	 * // or like this ...
	 * const wavesurfer = new WaveSurfer(params);
	 * wavesurfer.init();
	 *
	 * // load audio file
	 * wavesurfer.load('example/media/demo.wav');
	 */


	var WaveSurfer = /*#__PURE__*/function (_util$Observer) {
	  _inherits(WaveSurfer, _util$Observer);

	  var _super = _createSuper(WaveSurfer);

	  /**
	   * Initialise wavesurfer instance
	   *
	   * @param {WavesurferParams} params Instantiation options for wavesurfer
	   * @example
	   * const wavesurfer = new WaveSurfer(params);
	   * @returns {this} Wavesurfer instance
	   */
	  function WaveSurfer(params) {
	    var _this;

	    _classCallCheck(this, WaveSurfer);

	    _this = _super.call(this);
	    /**
	     * Extract relevant parameters (or defaults)
	     * @private
	     */

	    _defineProperty(_assertThisInitialized(_this), "defaultParams", {
	      audioContext: null,
	      audioScriptProcessor: null,
	      audioRate: 1,
	      autoCenter: true,
	      autoCenterRate: 5,
	      autoCenterImmediately: false,
	      backend: 'WebAudio',
	      backgroundColor: null,
	      barHeight: 1,
	      barRadius: 0,
	      barGap: null,
	      barMinHeight: null,
	      container: null,
	      cursorColor: '#333',
	      cursorWidth: 1,
	      dragSelection: true,
	      drawingContextAttributes: {
	        // Boolean that hints the user agent to reduce the latency
	        // by desynchronizing the canvas paint cycle from the event
	        // loop
	        desynchronized: false
	      },
	      duration: null,
	      fillParent: true,
	      forceDecode: false,
	      height: 128,
	      hideScrollbar: false,
	      hideCursor: false,
	      ignoreSilenceMode: false,
	      interact: true,
	      loopSelection: true,
	      maxCanvasWidth: 4000,
	      mediaContainer: null,
	      mediaControls: false,
	      mediaType: 'audio',
	      minPxPerSec: 20,
	      normalize: false,
	      partialRender: false,
	      pixelRatio: window.devicePixelRatio || screen.deviceXDPI / screen.logicalXDPI,
	      plugins: [],
	      progressColor: '#555',
	      removeMediaElementOnDestroy: true,
	      renderer: _drawer.default,
	      responsive: false,
	      rtl: false,
	      scrollParent: false,
	      skipLength: 2,
	      splitChannels: false,
	      splitChannelsOptions: {
	        overlay: false,
	        channelColors: {},
	        filterChannels: [],
	        relativeNormalization: false
	      },
	      vertical: false,
	      waveColor: '#999',
	      xhr: {}
	    });

	    _defineProperty(_assertThisInitialized(_this), "backends", {
	      MediaElement: _mediaelement.default,
	      WebAudio: _webaudio.default,
	      MediaElementWebAudio: _mediaelementWebaudio.default
	    });

	    _defineProperty(_assertThisInitialized(_this), "util", util);

	    _this.params = Object.assign({}, _this.defaultParams, params);
	    _this.params.splitChannelsOptions = Object.assign({}, _this.defaultParams.splitChannelsOptions, params.splitChannelsOptions);
	    /** @private */

	    _this.container = 'string' == typeof params.container ? document.querySelector(_this.params.container) : _this.params.container;

	    if (!_this.container) {
	      throw new Error('Container element not found');
	    }

	    if (_this.params.mediaContainer == null) {
	      /** @private */
	      _this.mediaContainer = _this.container;
	    } else if (typeof _this.params.mediaContainer == 'string') {
	      /** @private */
	      _this.mediaContainer = document.querySelector(_this.params.mediaContainer);
	    } else {
	      /** @private */
	      _this.mediaContainer = _this.params.mediaContainer;
	    }

	    if (!_this.mediaContainer) {
	      throw new Error('Media Container element not found');
	    }

	    if (_this.params.maxCanvasWidth <= 1) {
	      throw new Error('maxCanvasWidth must be greater than 1');
	    } else if (_this.params.maxCanvasWidth % 2 == 1) {
	      throw new Error('maxCanvasWidth must be an even number');
	    }

	    if (_this.params.rtl === true) {
	      if (_this.params.vertical === true) {
	        util.style(_this.container, {
	          transform: 'rotateX(180deg)'
	        });
	      } else {
	        util.style(_this.container, {
	          transform: 'rotateY(180deg)'
	        });
	      }
	    }

	    if (_this.params.backgroundColor) {
	      _this.setBackgroundColor(_this.params.backgroundColor);
	    }
	    /**
	     * @private Used to save the current volume when muting so we can
	     * restore once unmuted
	     * @type {number}
	     */


	    _this.savedVolume = 0;
	    /**
	     * @private The current muted state
	     * @type {boolean}
	     */

	    _this.isMuted = false;
	    /**
	     * @private Will hold a list of event descriptors that need to be
	     * canceled on subsequent loads of audio
	     * @type {Object[]}
	     */

	    _this.tmpEvents = [];
	    /**
	     * @private Holds any running audio downloads
	     * @type {Observer}
	     */

	    _this.currentRequest = null;
	    /** @private */

	    _this.arraybuffer = null;
	    /** @private */

	    _this.drawer = null;
	    /** @private */

	    _this.backend = null;
	    /** @private */

	    _this.peakCache = null; // cache constructor objects

	    if (typeof _this.params.renderer !== 'function') {
	      throw new Error('Renderer parameter is invalid');
	    }
	    /**
	     * @private The uninitialised Drawer class
	     */


	    _this.Drawer = _this.params.renderer;
	    /**
	     * @private The uninitialised Backend class
	     */
	    // Back compat

	    if (_this.params.backend == 'AudioElement') {
	      _this.params.backend = 'MediaElement';
	    }

	    if ((_this.params.backend == 'WebAudio' || _this.params.backend === 'MediaElementWebAudio') && !_webaudio.default.prototype.supportsWebAudio.call(null)) {
	      _this.params.backend = 'MediaElement';
	    }

	    _this.Backend = _this.backends[_this.params.backend];
	    /**
	     * @private map of plugin names that are currently initialised
	     */

	    _this.initialisedPluginList = {};
	    /** @private */

	    _this.isDestroyed = false;
	    /**
	     * Get the current ready status.
	     *
	     * @example const isReady = wavesurfer.isReady;
	     * @return {boolean}
	     */

	    _this.isReady = false; // responsive debounced event listener. If this.params.responsive is not
	    // set, this is never called. Use 100ms or this.params.responsive as
	    // timeout for the debounce function.

	    var prevWidth = 0;
	    _this._onResize = util.debounce(function () {
	      if (_this.drawer.wrapper && prevWidth != _this.drawer.wrapper.clientWidth && !_this.params.scrollParent) {
	        prevWidth = _this.drawer.wrapper.clientWidth;

	        if (prevWidth) {
	          // redraw only if waveform container is rendered and has a width
	          _this.drawer.fireEvent('redraw');
	        }
	      }
	    }, typeof _this.params.responsive === 'number' ? _this.params.responsive : 100);
	    return _possibleConstructorReturn(_this, _assertThisInitialized(_this));
	  }
	  /**
	   * Initialise the wave
	   *
	   * @example
	   * var wavesurfer = new WaveSurfer(params);
	   * wavesurfer.init();
	   * @return {this} The wavesurfer instance
	   */


	  _createClass(WaveSurfer, [{
	    key: "init",
	    value: function init() {
	      this.registerPlugins(this.params.plugins);
	      this.createDrawer();
	      this.createBackend();
	      this.createPeakCache();
	      return this;
	    }
	    /**
	     * Add and initialise array of plugins (if `plugin.deferInit` is falsey),
	     * this function is called in the init function of wavesurfer
	     *
	     * @param {PluginDefinition[]} plugins An array of plugin definitions
	     * @emits {WaveSurfer#plugins-registered} Called with the array of plugin definitions
	     * @return {this} The wavesurfer instance
	     */

	  }, {
	    key: "registerPlugins",
	    value: function registerPlugins(plugins) {
	      var _this2 = this;

	      // first instantiate all the plugins
	      plugins.forEach(function (plugin) {
	        return _this2.addPlugin(plugin);
	      }); // now run the init functions

	      plugins.forEach(function (plugin) {
	        // call init function of the plugin if deferInit is falsey
	        // in that case you would manually use initPlugins()
	        if (!plugin.deferInit) {
	          _this2.initPlugin(plugin.name);
	        }
	      });
	      this.fireEvent('plugins-registered', plugins);
	      return this;
	    }
	    /**
	     * Get a map of plugin names that are currently initialised
	     *
	     * @example wavesurfer.getPlugins();
	     * @return {Object} Object with plugin names
	     */

	  }, {
	    key: "getActivePlugins",
	    value: function getActivePlugins() {
	      return this.initialisedPluginList;
	    }
	    /**
	     * Add a plugin object to wavesurfer
	     *
	     * @param {PluginDefinition} plugin A plugin definition
	     * @emits {WaveSurfer#plugin-added} Called with the name of the plugin that was added
	     * @example wavesurfer.addPlugin(WaveSurfer.minimap());
	     * @return {this} The wavesurfer instance
	     */

	  }, {
	    key: "addPlugin",
	    value: function addPlugin(plugin) {
	      var _this3 = this;

	      if (!plugin.name) {
	        throw new Error('Plugin does not have a name!');
	      }

	      if (!plugin.instance) {
	        throw new Error("Plugin ".concat(plugin.name, " does not have an instance property!"));
	      } // staticProps properties are applied to wavesurfer instance


	      if (plugin.staticProps) {
	        Object.keys(plugin.staticProps).forEach(function (pluginStaticProp) {
	          /**
	           * Properties defined in a plugin definition's `staticProps` property are added as
	           * staticProps properties of the WaveSurfer instance
	           */
	          _this3[pluginStaticProp] = plugin.staticProps[pluginStaticProp];
	        });
	      }

	      var Instance = plugin.instance; // turn the plugin instance into an observer

	      var observerPrototypeKeys = Object.getOwnPropertyNames(util.Observer.prototype);
	      observerPrototypeKeys.forEach(function (key) {
	        Instance.prototype[key] = util.Observer.prototype[key];
	      });
	      /**
	       * Instantiated plugin classes are added as a property of the wavesurfer
	       * instance
	       * @type {Object}
	       */

	      this[plugin.name] = new Instance(plugin.params || {}, this);
	      this.fireEvent('plugin-added', plugin.name);
	      return this;
	    }
	    /**
	     * Initialise a plugin
	     *
	     * @param {string} name A plugin name
	     * @emits WaveSurfer#plugin-initialised
	     * @example wavesurfer.initPlugin('minimap');
	     * @return {this} The wavesurfer instance
	     */

	  }, {
	    key: "initPlugin",
	    value: function initPlugin(name) {
	      if (!this[name]) {
	        throw new Error("Plugin ".concat(name, " has not been added yet!"));
	      }

	      if (this.initialisedPluginList[name]) {
	        // destroy any already initialised plugins
	        this.destroyPlugin(name);
	      }

	      this[name].init();
	      this.initialisedPluginList[name] = true;
	      this.fireEvent('plugin-initialised', name);
	      return this;
	    }
	    /**
	     * Destroy a plugin
	     *
	     * @param {string} name A plugin name
	     * @emits WaveSurfer#plugin-destroyed
	     * @example wavesurfer.destroyPlugin('minimap');
	     * @returns {this} The wavesurfer instance
	     */

	  }, {
	    key: "destroyPlugin",
	    value: function destroyPlugin(name) {
	      if (!this[name]) {
	        throw new Error("Plugin ".concat(name, " has not been added yet and cannot be destroyed!"));
	      }

	      if (!this.initialisedPluginList[name]) {
	        throw new Error("Plugin ".concat(name, " is not active and cannot be destroyed!"));
	      }

	      if (typeof this[name].destroy !== 'function') {
	        throw new Error("Plugin ".concat(name, " does not have a destroy function!"));
	      }

	      this[name].destroy();
	      delete this.initialisedPluginList[name];
	      this.fireEvent('plugin-destroyed', name);
	      return this;
	    }
	    /**
	     * Destroy all initialised plugins. Convenience function to use when
	     * wavesurfer is removed
	     *
	     * @private
	     */

	  }, {
	    key: "destroyAllPlugins",
	    value: function destroyAllPlugins() {
	      var _this4 = this;

	      Object.keys(this.initialisedPluginList).forEach(function (name) {
	        return _this4.destroyPlugin(name);
	      });
	    }
	    /**
	     * Create the drawer and draw the waveform
	     *
	     * @private
	     * @emits WaveSurfer#drawer-created
	     */

	  }, {
	    key: "createDrawer",
	    value: function createDrawer() {
	      var _this5 = this;

	      this.drawer = new this.Drawer(this.container, this.params);
	      this.drawer.init();
	      this.fireEvent('drawer-created', this.drawer);

	      if (this.params.responsive !== false) {
	        window.addEventListener('resize', this._onResize, true);
	        window.addEventListener('orientationchange', this._onResize, true);
	      }

	      this.drawer.on('redraw', function () {
	        _this5.drawBuffer();

	        _this5.drawer.progress(_this5.backend.getPlayedPercents());
	      }); // Click-to-seek

	      this.drawer.on('click', function (e, progress) {
	        setTimeout(function () {
	          return _this5.seekTo(progress);
	        }, 0);
	      }); // Relay the scroll event from the drawer

	      this.drawer.on('scroll', function (e) {
	        if (_this5.params.partialRender) {
	          _this5.drawBuffer();
	        }

	        _this5.fireEvent('scroll', e);
	      });
	    }
	    /**
	     * Create the backend
	     *
	     * @private
	     * @emits WaveSurfer#backend-created
	     */

	  }, {
	    key: "createBackend",
	    value: function createBackend() {
	      var _this6 = this;

	      if (this.backend) {
	        this.backend.destroy();
	      }

	      this.backend = new this.Backend(this.params);
	      this.backend.init();
	      this.fireEvent('backend-created', this.backend);
	      this.backend.on('finish', function () {
	        _this6.drawer.progress(_this6.backend.getPlayedPercents());

	        _this6.fireEvent('finish');
	      });
	      this.backend.on('play', function () {
	        return _this6.fireEvent('play');
	      });
	      this.backend.on('pause', function () {
	        return _this6.fireEvent('pause');
	      });
	      this.backend.on('audioprocess', function (time) {
	        _this6.drawer.progress(_this6.backend.getPlayedPercents());

	        _this6.fireEvent('audioprocess', time);
	      }); // only needed for MediaElement and MediaElementWebAudio backend

	      if (this.params.backend === 'MediaElement' || this.params.backend === 'MediaElementWebAudio') {
	        this.backend.on('seek', function () {
	          _this6.drawer.progress(_this6.backend.getPlayedPercents());
	        });
	        this.backend.on('volume', function () {
	          var newVolume = _this6.getVolume();

	          _this6.fireEvent('volume', newVolume);

	          if (_this6.backend.isMuted !== _this6.isMuted) {
	            _this6.isMuted = _this6.backend.isMuted;

	            _this6.fireEvent('mute', _this6.isMuted);
	          }
	        });
	      }
	    }
	    /**
	     * Create the peak cache
	     *
	     * @private
	     */

	  }, {
	    key: "createPeakCache",
	    value: function createPeakCache() {
	      if (this.params.partialRender) {
	        this.peakCache = new _peakcache.default();
	      }
	    }
	    /**
	     * Get the duration of the audio clip
	     *
	     * @example const duration = wavesurfer.getDuration();
	     * @return {number} Duration in seconds
	     */

	  }, {
	    key: "getDuration",
	    value: function getDuration() {
	      return this.backend.getDuration();
	    }
	    /**
	     * Get the current playback position
	     *
	     * @example const currentTime = wavesurfer.getCurrentTime();
	     * @return {number} Playback position in seconds
	     */

	  }, {
	    key: "getCurrentTime",
	    value: function getCurrentTime() {
	      return this.backend.getCurrentTime();
	    }
	    /**
	     * Set the current play time in seconds.
	     *
	     * @param {number} seconds A positive number in seconds. E.g. 10 means 10
	     * seconds, 60 means 1 minute
	     */

	  }, {
	    key: "setCurrentTime",
	    value: function setCurrentTime(seconds) {
	      if (seconds >= this.getDuration()) {
	        this.seekTo(1);
	      } else {
	        this.seekTo(seconds / this.getDuration());
	      }
	    }
	    /**
	     * Starts playback from the current position. Optional start and end
	     * measured in seconds can be used to set the range of audio to play.
	     *
	     * @param {?number} start Position to start at
	     * @param {?number} end Position to end at
	     * @emits WaveSurfer#interaction
	     * @return {Promise} Result of the backend play method
	     * @example
	     * // play from second 1 to 5
	     * wavesurfer.play(1, 5);
	     */

	  }, {
	    key: "play",
	    value: function play(start, end) {
	      var _this7 = this;

	      if (this.params.ignoreSilenceMode) {
	        // ignores device hardware silence mode
	        util.ignoreSilenceMode();
	      }

	      this.fireEvent('interaction', function () {
	        return _this7.play(start, end);
	      });
	      return this.backend.play(start, end);
	    }
	    /**
	     * Set a point in seconds for playback to stop at.
	     *
	     * @param {number} position Position (in seconds) to stop at
	     * @version 3.3.0
	     */

	  }, {
	    key: "setPlayEnd",
	    value: function setPlayEnd(position) {
	      this.backend.setPlayEnd(position);
	    }
	    /**
	     * Stops and pauses playback
	     *
	     * @example wavesurfer.pause();
	     * @return {Promise} Result of the backend pause method
	     */

	  }, {
	    key: "pause",
	    value: function pause() {
	      if (!this.backend.isPaused()) {
	        return this.backend.pause();
	      }
	    }
	    /**
	     * Toggle playback
	     *
	     * @example wavesurfer.playPause();
	     * @return {Promise} Result of the backend play or pause method
	     */

	  }, {
	    key: "playPause",
	    value: function playPause() {
	      return this.backend.isPaused() ? this.play() : this.pause();
	    }
	    /**
	     * Get the current playback state
	     *
	     * @example const isPlaying = wavesurfer.isPlaying();
	     * @return {boolean} False if paused, true if playing
	     */

	  }, {
	    key: "isPlaying",
	    value: function isPlaying() {
	      return !this.backend.isPaused();
	    }
	    /**
	     * Skip backward
	     *
	     * @param {?number} seconds Amount to skip back, if not specified `skipLength`
	     * is used
	     * @example wavesurfer.skipBackward();
	     */

	  }, {
	    key: "skipBackward",
	    value: function skipBackward(seconds) {
	      this.skip(-seconds || -this.params.skipLength);
	    }
	    /**
	     * Skip forward
	     *
	     * @param {?number} seconds Amount to skip back, if not specified `skipLength`
	     * is used
	     * @example wavesurfer.skipForward();
	     */

	  }, {
	    key: "skipForward",
	    value: function skipForward(seconds) {
	      this.skip(seconds || this.params.skipLength);
	    }
	    /**
	     * Skip a number of seconds from the current position (use a negative value
	     * to go backwards).
	     *
	     * @param {number} offset Amount to skip back or forwards
	     * @example
	     * // go back 2 seconds
	     * wavesurfer.skip(-2);
	     */

	  }, {
	    key: "skip",
	    value: function skip(offset) {
	      var duration = this.getDuration() || 1;
	      var position = this.getCurrentTime() || 0;
	      position = Math.max(0, Math.min(duration, position + (offset || 0)));
	      this.seekAndCenter(position / duration);
	    }
	    /**
	     * Seeks to a position and centers the view
	     *
	     * @param {number} progress Between 0 (=beginning) and 1 (=end)
	     * @example
	     * // seek and go to the middle of the audio
	     * wavesurfer.seekTo(0.5);
	     */

	  }, {
	    key: "seekAndCenter",
	    value: function seekAndCenter(progress) {
	      this.seekTo(progress);
	      this.drawer.recenter(progress);
	    }
	    /**
	     * Seeks to a position
	     *
	     * @param {number} progress Between 0 (=beginning) and 1 (=end)
	     * @emits WaveSurfer#interaction
	     * @emits WaveSurfer#seek
	     * @example
	     * // seek to the middle of the audio
	     * wavesurfer.seekTo(0.5);
	     */

	  }, {
	    key: "seekTo",
	    value: function seekTo(progress) {
	      var _this8 = this;

	      // return an error if progress is not a number between 0 and 1
	      if (typeof progress !== 'number' || !isFinite(progress) || progress < 0 || progress > 1) {
	        throw new Error('Error calling wavesurfer.seekTo, parameter must be a number between 0 and 1!');
	      }

	      this.fireEvent('interaction', function () {
	        return _this8.seekTo(progress);
	      });
	      var isWebAudioBackend = this.params.backend === 'WebAudio';
	      var paused = this.backend.isPaused();

	      if (isWebAudioBackend && !paused) {
	        this.backend.pause();
	      } // avoid small scrolls while paused seeking


	      var oldScrollParent = this.params.scrollParent;
	      this.params.scrollParent = false;
	      this.backend.seekTo(progress * this.getDuration());
	      this.drawer.progress(progress);

	      if (isWebAudioBackend && !paused) {
	        this.backend.play();
	      }

	      this.params.scrollParent = oldScrollParent;
	      this.fireEvent('seek', progress);
	    }
	    /**
	     * Stops and goes to the beginning.
	     *
	     * @example wavesurfer.stop();
	     */

	  }, {
	    key: "stop",
	    value: function stop() {
	      this.pause();
	      this.seekTo(0);
	      this.drawer.progress(0);
	    }
	    /**
	     * Sets the ID of the audio device to use for output and returns a Promise.
	     *
	     * @param {string} deviceId String value representing underlying output
	     * device
	     * @returns {Promise} `Promise` that resolves to `undefined` when there are
	     * no errors detected.
	     */

	  }, {
	    key: "setSinkId",
	    value: function setSinkId(deviceId) {
	      return this.backend.setSinkId(deviceId);
	    }
	    /**
	     * Set the playback volume.
	     *
	     * @param {number} newVolume A value between 0 and 1, 0 being no
	     * volume and 1 being full volume.
	     * @emits WaveSurfer#volume
	     */

	  }, {
	    key: "setVolume",
	    value: function setVolume(newVolume) {
	      this.backend.setVolume(newVolume);
	      this.fireEvent('volume', newVolume);
	    }
	    /**
	     * Get the playback volume.
	     *
	     * @return {number} A value between 0 and 1, 0 being no
	     * volume and 1 being full volume.
	     */

	  }, {
	    key: "getVolume",
	    value: function getVolume() {
	      return this.backend.getVolume();
	    }
	    /**
	     * Set the playback rate.
	     *
	     * @param {number} rate A positive number. E.g. 0.5 means half the normal
	     * speed, 2 means double speed and so on.
	     * @example wavesurfer.setPlaybackRate(2);
	     */

	  }, {
	    key: "setPlaybackRate",
	    value: function setPlaybackRate(rate) {
	      this.backend.setPlaybackRate(rate);
	    }
	    /**
	     * Get the playback rate.
	     *
	     * @return {number} The current playback rate.
	     */

	  }, {
	    key: "getPlaybackRate",
	    value: function getPlaybackRate() {
	      return this.backend.getPlaybackRate();
	    }
	    /**
	     * Toggle the volume on and off. If not currently muted it will save the
	     * current volume value and turn the volume off. If currently muted then it
	     * will restore the volume to the saved value, and then rest the saved
	     * value.
	     *
	     * @example wavesurfer.toggleMute();
	     */

	  }, {
	    key: "toggleMute",
	    value: function toggleMute() {
	      this.setMute(!this.isMuted);
	    }
	    /**
	     * Enable or disable muted audio
	     *
	     * @param {boolean} mute Specify `true` to mute audio.
	     * @emits WaveSurfer#volume
	     * @emits WaveSurfer#mute
	     * @example
	     * // unmute
	     * wavesurfer.setMute(false);
	     * console.log(wavesurfer.getMute()) // logs false
	     */

	  }, {
	    key: "setMute",
	    value: function setMute(mute) {
	      // ignore all muting requests if the audio is already in that state
	      if (mute === this.isMuted) {
	        this.fireEvent('mute', this.isMuted);
	        return;
	      }

	      if (this.backend.setMute) {
	        // Backends such as the MediaElement backend have their own handling
	        // of mute, let them handle it.
	        this.backend.setMute(mute);
	        this.isMuted = mute;
	      } else {
	        if (mute) {
	          // If currently not muted then save current volume,
	          // turn off the volume and update the mute properties
	          this.savedVolume = this.backend.getVolume();
	          this.backend.setVolume(0);
	          this.isMuted = true;
	          this.fireEvent('volume', 0);
	        } else {
	          // If currently muted then restore to the saved volume
	          // and update the mute properties
	          this.backend.setVolume(this.savedVolume);
	          this.isMuted = false;
	          this.fireEvent('volume', this.savedVolume);
	        }
	      }

	      this.fireEvent('mute', this.isMuted);
	    }
	    /**
	     * Get the current mute status.
	     *
	     * @example const isMuted = wavesurfer.getMute();
	     * @return {boolean} Current mute status
	     */

	  }, {
	    key: "getMute",
	    value: function getMute() {
	      return this.isMuted;
	    }
	    /**
	     * Get the list of current set filters as an array.
	     *
	     * Filters must be set with setFilters method first
	     *
	     * @return {array} List of enabled filters
	     */

	  }, {
	    key: "getFilters",
	    value: function getFilters() {
	      return this.backend.filters || [];
	    }
	    /**
	     * Toggles `scrollParent` and redraws
	     *
	     * @example wavesurfer.toggleScroll();
	     */

	  }, {
	    key: "toggleScroll",
	    value: function toggleScroll() {
	      this.params.scrollParent = !this.params.scrollParent;
	      this.drawBuffer();
	    }
	    /**
	     * Toggle mouse interaction
	     *
	     * @example wavesurfer.toggleInteraction();
	     */

	  }, {
	    key: "toggleInteraction",
	    value: function toggleInteraction() {
	      this.params.interact = !this.params.interact;
	    }
	    /**
	     * Get the fill color of the waveform after the cursor.
	     *
	     * @param {?number} channelIdx Optional index of the channel to get its wave color if splitChannels is true
	     * @return {string|object} A CSS color string, or an array of CSS color strings.
	     */

	  }, {
	    key: "getWaveColor",
	    value: function getWaveColor() {
	      var channelIdx = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

	      if (this.params.splitChannelsOptions.channelColors[channelIdx]) {
	        return this.params.splitChannelsOptions.channelColors[channelIdx].waveColor;
	      }

	      return this.params.waveColor;
	    }
	    /**
	     * Set the fill color of the waveform after the cursor.
	     *
	     * @param {string|object} color A CSS color string, or an array of CSS color strings.
	     * @param {?number} channelIdx Optional index of the channel to set its wave color if splitChannels is true
	     * @example wavesurfer.setWaveColor('#ddd');
	     */

	  }, {
	    key: "setWaveColor",
	    value: function setWaveColor(color) {
	      var channelIdx = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

	      if (this.params.splitChannelsOptions.channelColors[channelIdx]) {
	        this.params.splitChannelsOptions.channelColors[channelIdx].waveColor = color;
	      } else {
	        this.params.waveColor = color;
	      }

	      this.drawBuffer();
	    }
	    /**
	     * Get the fill color of the waveform behind the cursor.
	     *
	     * @param {?number} channelIdx Optional index of the channel to get its progress color if splitChannels is true
	     * @return {string|object} A CSS color string, or an array of CSS color strings.
	     */

	  }, {
	    key: "getProgressColor",
	    value: function getProgressColor() {
	      var channelIdx = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

	      if (this.params.splitChannelsOptions.channelColors[channelIdx]) {
	        return this.params.splitChannelsOptions.channelColors[channelIdx].progressColor;
	      }

	      return this.params.progressColor;
	    }
	    /**
	     * Set the fill color of the waveform behind the cursor.
	     *
	     * @param {string|object} color A CSS color string, or an array of CSS color strings.
	     * @param {?number} channelIdx Optional index of the channel to set its progress color if splitChannels is true
	     * @example wavesurfer.setProgressColor('#400');
	     */

	  }, {
	    key: "setProgressColor",
	    value: function setProgressColor(color, channelIdx) {
	      if (this.params.splitChannelsOptions.channelColors[channelIdx]) {
	        this.params.splitChannelsOptions.channelColors[channelIdx].progressColor = color;
	      } else {
	        this.params.progressColor = color;
	      }

	      this.drawBuffer();
	    }
	    /**
	     * Get the background color of the waveform container.
	     *
	     * @return {string} A CSS color string.
	     */

	  }, {
	    key: "getBackgroundColor",
	    value: function getBackgroundColor() {
	      return this.params.backgroundColor;
	    }
	    /**
	     * Set the background color of the waveform container.
	     *
	     * @param {string} color A CSS color string.
	     * @example wavesurfer.setBackgroundColor('#FF00FF');
	     */

	  }, {
	    key: "setBackgroundColor",
	    value: function setBackgroundColor(color) {
	      this.params.backgroundColor = color;
	      util.style(this.container, {
	        background: this.params.backgroundColor
	      });
	    }
	    /**
	     * Get the fill color of the cursor indicating the playhead
	     * position.
	     *
	     * @return {string} A CSS color string.
	     */

	  }, {
	    key: "getCursorColor",
	    value: function getCursorColor() {
	      return this.params.cursorColor;
	    }
	    /**
	     * Set the fill color of the cursor indicating the playhead
	     * position.
	     *
	     * @param {string} color A CSS color string.
	     * @example wavesurfer.setCursorColor('#222');
	     */

	  }, {
	    key: "setCursorColor",
	    value: function setCursorColor(color) {
	      this.params.cursorColor = color;
	      this.drawer.updateCursor();
	    }
	    /**
	     * Get the height of the waveform.
	     *
	     * @return {number} Height measured in pixels.
	     */

	  }, {
	    key: "getHeight",
	    value: function getHeight() {
	      return this.params.height;
	    }
	    /**
	     * Set the height of the waveform.
	     *
	     * @param {number} height Height measured in pixels.
	     * @example wavesurfer.setHeight(200);
	     */

	  }, {
	    key: "setHeight",
	    value: function setHeight(height) {
	      this.params.height = height;
	      this.drawer.setHeight(height * this.params.pixelRatio);
	      this.drawBuffer();
	    }
	    /**
	     * Hide channels from being drawn on the waveform if splitting channels.
	     *
	     * For example, if we want to draw only the peaks for the right stereo channel:
	     *
	     * const wavesurfer = new WaveSurfer.create({...splitChannels: true});
	     * wavesurfer.load('stereo_audio.mp3');
	     *
	     * wavesurfer.setFilteredChannel([0]); <-- hide left channel peaks.
	     *
	     * @param {array} channelIndices Channels to be filtered out from drawing.
	     * @version 4.0.0
	     */

	  }, {
	    key: "setFilteredChannels",
	    value: function setFilteredChannels(channelIndices) {
	      this.params.splitChannelsOptions.filterChannels = channelIndices;
	      this.drawBuffer();
	    }
	    /**
	     * Get the correct peaks for current wave view-port and render wave
	     *
	     * @private
	     * @emits WaveSurfer#redraw
	     */

	  }, {
	    key: "drawBuffer",
	    value: function drawBuffer() {
	      var nominalWidth = Math.round(this.getDuration() * this.params.minPxPerSec * this.params.pixelRatio);
	      var parentWidth = this.drawer.getWidth();
	      var width = nominalWidth; // always start at 0 after zooming for scrolling : issue redraw left part

	      var start = 0;
	      var end = Math.max(start + parentWidth, width); // Fill container

	      if (this.params.fillParent && (!this.params.scrollParent || nominalWidth < parentWidth)) {
	        width = parentWidth;
	        start = 0;
	        end = width;
	      }

	      var peaks;

	      if (this.params.partialRender) {
	        var newRanges = this.peakCache.addRangeToPeakCache(width, start, end);
	        var i;

	        for (i = 0; i < newRanges.length; i++) {
	          peaks = this.backend.getPeaks(width, newRanges[i][0], newRanges[i][1]);
	          this.drawer.drawPeaks(peaks, width, newRanges[i][0], newRanges[i][1]);
	        }
	      } else {
	        peaks = this.backend.getPeaks(width, start, end);
	        this.drawer.drawPeaks(peaks, width, start, end);
	      }

	      this.fireEvent('redraw', peaks, width);
	    }
	    /**
	     * Horizontally zooms the waveform in and out. It also changes the parameter
	     * `minPxPerSec` and enables the `scrollParent` option. Calling the function
	     * with a falsey parameter will reset the zoom state.
	     *
	     * @param {?number} pxPerSec Number of horizontal pixels per second of
	     * audio, if none is set the waveform returns to unzoomed state
	     * @emits WaveSurfer#zoom
	     * @example wavesurfer.zoom(20);
	     */

	  }, {
	    key: "zoom",
	    value: function zoom(pxPerSec) {
	      if (!pxPerSec) {
	        this.params.minPxPerSec = this.defaultParams.minPxPerSec;
	        this.params.scrollParent = false;
	      } else {
	        this.params.minPxPerSec = pxPerSec;
	        this.params.scrollParent = true;
	      }

	      this.drawBuffer();
	      this.drawer.progress(this.backend.getPlayedPercents());
	      this.drawer.recenter(this.getCurrentTime() / this.getDuration());
	      this.fireEvent('zoom', pxPerSec);
	    }
	    /**
	     * Decode buffer and load
	     *
	     * @private
	     * @param {ArrayBuffer} arraybuffer Buffer to process
	     */

	  }, {
	    key: "loadArrayBuffer",
	    value: function loadArrayBuffer(arraybuffer) {
	      var _this9 = this;

	      this.decodeArrayBuffer(arraybuffer, function (data) {
	        if (!_this9.isDestroyed) {
	          _this9.loadDecodedBuffer(data);
	        }
	      });
	    }
	    /**
	     * Directly load an externally decoded AudioBuffer
	     *
	     * @private
	     * @param {AudioBuffer} buffer Buffer to process
	     * @emits WaveSurfer#ready
	     */

	  }, {
	    key: "loadDecodedBuffer",
	    value: function loadDecodedBuffer(buffer) {
	      this.backend.load(buffer);
	      this.drawBuffer();
	      this.isReady = true;
	      this.fireEvent('ready');
	    }
	    /**
	     * Loads audio data from a Blob or File object
	     *
	     * @param {Blob|File} blob Audio data
	     * @example
	     */

	  }, {
	    key: "loadBlob",
	    value: function loadBlob(blob) {
	      var _this10 = this;

	      // Create file reader
	      var reader = new FileReader();
	      reader.addEventListener('progress', function (e) {
	        return _this10.onProgress(e);
	      });
	      reader.addEventListener('load', function (e) {
	        return _this10.loadArrayBuffer(e.target.result);
	      });
	      reader.addEventListener('error', function () {
	        return _this10.fireEvent('error', 'Error reading file');
	      });
	      reader.readAsArrayBuffer(blob);
	      this.empty();
	    }
	    /**
	     * Loads audio and re-renders the waveform.
	     *
	     * @param {string|HTMLMediaElement} url The url of the audio file or the
	     * audio element with the audio
	     * @param {number[]|Number.<Array[]>} peaks Wavesurfer does not have to decode
	     * the audio to render the waveform if this is specified
	     * @param {?string} preload (Use with backend `MediaElement` and `MediaElementWebAudio`)
	     * `'none'|'metadata'|'auto'` Preload attribute for the media element
	     * @param {?number} duration The duration of the audio. This is used to
	     * render the peaks data in the correct size for the audio duration (as
	     * befits the current `minPxPerSec` and zoom value) without having to decode
	     * the audio.
	     * @returns {void}
	     * @throws Will throw an error if the `url` argument is empty.
	     * @example
	     * // uses fetch or media element to load file (depending on backend)
	     * wavesurfer.load('http://example.com/demo.wav');
	     *
	     * // setting preload attribute with media element backend and supplying
	     * // peaks
	     * wavesurfer.load(
	     *   'http://example.com/demo.wav',
	     *   [0.0218, 0.0183, 0.0165, 0.0198, 0.2137, 0.2888],
	     *   true
	     * );
	     */

	  }, {
	    key: "load",
	    value: function load(url, peaks, preload, duration) {
	      if (!url) {
	        throw new Error('url parameter cannot be empty');
	      }

	      this.empty();

	      if (preload) {
	        // check whether the preload attribute will be usable and if not log
	        // a warning listing the reasons why not and nullify the variable
	        var preloadIgnoreReasons = {
	          "Preload is not 'auto', 'none' or 'metadata'": ['auto', 'metadata', 'none'].indexOf(preload) === -1,
	          'Peaks are not provided': !peaks,
	          "Backend is not of type 'MediaElement' or 'MediaElementWebAudio'": ['MediaElement', 'MediaElementWebAudio'].indexOf(this.params.backend) === -1,
	          'Url is not of type string': typeof url !== 'string'
	        };
	        var activeReasons = Object.keys(preloadIgnoreReasons).filter(function (reason) {
	          return preloadIgnoreReasons[reason];
	        });

	        if (activeReasons.length) {
	          // eslint-disable-next-line no-console
	          console.warn('Preload parameter of wavesurfer.load will be ignored because:\n\t- ' + activeReasons.join('\n\t- ')); // stop invalid values from being used

	          preload = null;
	        }
	      } // loadBuffer(url, peaks, duration) requires that url is a string
	      // but users can pass in a HTMLMediaElement to WaveSurfer


	      if (this.params.backend === 'WebAudio' && url instanceof HTMLMediaElement) {
	        url = url.src;
	      }

	      switch (this.params.backend) {
	        case 'WebAudio':
	          return this.loadBuffer(url, peaks, duration);

	        case 'MediaElement':
	        case 'MediaElementWebAudio':
	          return this.loadMediaElement(url, peaks, preload, duration);
	      }
	    }
	    /**
	     * Loads audio using Web Audio buffer backend.
	     *
	     * @private
	     * @emits WaveSurfer#waveform-ready
	     * @param {string} url URL of audio file
	     * @param {number[]|Number.<Array[]>} peaks Peaks data
	     * @param {?number} duration Optional duration of audio file
	     * @returns {void}
	     */

	  }, {
	    key: "loadBuffer",
	    value: function loadBuffer(url, peaks, duration) {
	      var _this11 = this;

	      var load = function load(action) {
	        if (action) {
	          _this11.tmpEvents.push(_this11.once('ready', action));
	        }

	        return _this11.getArrayBuffer(url, function (data) {
	          return _this11.loadArrayBuffer(data);
	        });
	      };

	      if (peaks) {
	        this.backend.setPeaks(peaks, duration);
	        this.drawBuffer();
	        this.fireEvent('waveform-ready');
	        this.tmpEvents.push(this.once('interaction', load));
	      } else {
	        return load();
	      }
	    }
	    /**
	     * Either create a media element, or load an existing media element.
	     *
	     * @private
	     * @emits WaveSurfer#waveform-ready
	     * @param {string|HTMLMediaElement} urlOrElt Either a path to a media file, or an
	     * existing HTML5 Audio/Video Element
	     * @param {number[]|Number.<Array[]>} peaks Array of peaks. Required to bypass web audio
	     * dependency
	     * @param {?boolean} preload Set to true if the preload attribute of the
	     * audio element should be enabled
	     * @param {?number} duration Optional duration of audio file
	     */

	  }, {
	    key: "loadMediaElement",
	    value: function loadMediaElement(urlOrElt, peaks, preload, duration) {
	      var _this12 = this;

	      var url = urlOrElt;

	      if (typeof urlOrElt === 'string') {
	        this.backend.load(url, this.mediaContainer, peaks, preload);
	      } else {
	        var elt = urlOrElt;
	        this.backend.loadElt(elt, peaks); // If peaks are not provided,
	        // url = element.src so we can get peaks with web audio

	        url = elt.src;
	      }

	      this.tmpEvents.push(this.backend.once('canplay', function () {
	        // ignore when backend was already destroyed
	        if (!_this12.backend.destroyed) {
	          _this12.drawBuffer();

	          _this12.isReady = true;

	          _this12.fireEvent('ready');
	        }
	      }), this.backend.once('error', function (err) {
	        return _this12.fireEvent('error', err);
	      })); // If peaks are provided, render them and fire the `waveform-ready` event.

	      if (peaks) {
	        this.backend.setPeaks(peaks, duration);
	        this.drawBuffer();
	        this.fireEvent('waveform-ready');
	      } // If no pre-decoded peaks are provided, or are provided with
	      // forceDecode flag, attempt to download the audio file and decode it
	      // with Web Audio.


	      if ((!peaks || this.params.forceDecode) && this.backend.supportsWebAudio()) {
	        this.getArrayBuffer(url, function (arraybuffer) {
	          _this12.decodeArrayBuffer(arraybuffer, function (buffer) {
	            _this12.backend.buffer = buffer;

	            _this12.backend.setPeaks(null);

	            _this12.drawBuffer();

	            _this12.fireEvent('waveform-ready');
	          });
	        });
	      }
	    }
	    /**
	     * Decode an array buffer and pass data to a callback
	     *
	     * @private
	     * @param {Object} arraybuffer The array buffer to decode
	     * @param {function} callback The function to call on complete
	     */

	  }, {
	    key: "decodeArrayBuffer",
	    value: function decodeArrayBuffer(arraybuffer, callback) {
	      var _this13 = this;

	      if (!this.isDestroyed) {
	        this.arraybuffer = arraybuffer;
	        this.backend.decodeArrayBuffer(arraybuffer, function (data) {
	          // Only use the decoded data if we haven't been destroyed or
	          // another decode started in the meantime
	          if (!_this13.isDestroyed && _this13.arraybuffer == arraybuffer) {
	            callback(data);
	            _this13.arraybuffer = null;
	          }
	        }, function () {
	          return _this13.fireEvent('error', 'Error decoding audiobuffer');
	        });
	      }
	    }
	    /**
	     * Load an array buffer using fetch and pass the result to a callback
	     *
	     * @param {string} url The URL of the file object
	     * @param {function} callback The function to call on complete
	     * @returns {util.fetchFile} fetch call
	     * @private
	     */

	  }, {
	    key: "getArrayBuffer",
	    value: function getArrayBuffer(url, callback) {
	      var _this14 = this;

	      var options = Object.assign({
	        url: url,
	        responseType: 'arraybuffer'
	      }, this.params.xhr);
	      var request = util.fetchFile(options);
	      this.currentRequest = request;
	      this.tmpEvents.push(request.on('progress', function (e) {
	        _this14.onProgress(e);
	      }), request.on('success', function (data) {
	        callback(data);
	        _this14.currentRequest = null;
	      }), request.on('error', function (e) {
	        _this14.fireEvent('error', e);

	        _this14.currentRequest = null;
	      }));
	      return request;
	    }
	    /**
	     * Called while the audio file is loading
	     *
	     * @private
	     * @param {Event} e Progress event
	     * @emits WaveSurfer#loading
	     */

	  }, {
	    key: "onProgress",
	    value: function onProgress(e) {
	      var percentComplete;

	      if (e.lengthComputable) {
	        percentComplete = e.loaded / e.total;
	      } else {
	        // Approximate progress with an asymptotic
	        // function, and assume downloads in the 1-3 MB range.
	        percentComplete = e.loaded / (e.loaded + 1000000);
	      }

	      this.fireEvent('loading', Math.round(percentComplete * 100), e.target);
	    }
	    /**
	     * Exports PCM data into a JSON array and optionally opens in a new window
	     * as valid JSON Blob instance.
	     *
	     * @param {number} length=1024 The scale in which to export the peaks
	     * @param {number} accuracy=10000
	     * @param {?boolean} noWindow Set to true to disable opening a new
	     * window with the JSON
	     * @param {number} start Start index
	     * @param {number} end End index
	     * @return {Promise} Promise that resolves with array of peaks
	     */

	  }, {
	    key: "exportPCM",
	    value: function exportPCM(length, accuracy, noWindow, start, end) {
	      length = length || 1024;
	      start = start || 0;
	      accuracy = accuracy || 10000;
	      noWindow = noWindow || false;
	      var peaks = this.backend.getPeaks(length, start, end);
	      var arr = [].map.call(peaks, function (val) {
	        return Math.round(val * accuracy) / accuracy;
	      });
	      return new Promise(function (resolve, reject) {
	        if (!noWindow) {
	          var blobJSON = new Blob([JSON.stringify(arr)], {
	            type: 'application/json;charset=utf-8'
	          });
	          var objURL = URL.createObjectURL(blobJSON);
	          window.open(objURL);
	          URL.revokeObjectURL(objURL);
	        }

	        resolve(arr);
	      });
	    }
	    /**
	     * Save waveform image as data URI.
	     *
	     * The default format is `'image/png'`. Other supported types are
	     * `'image/jpeg'` and `'image/webp'`.
	     *
	     * @param {string} format='image/png' A string indicating the image format.
	     * The default format type is `'image/png'`.
	     * @param {number} quality=1 A number between 0 and 1 indicating the image
	     * quality to use for image formats that use lossy compression such as
	     * `'image/jpeg'`` and `'image/webp'`.
	     * @param {string} type Image data type to return. Either 'dataURL' (default)
	     * or 'blob'.
	     * @return {string|string[]|Promise} When using `'dataURL'` type this returns
	     * a single data URL or an array of data URLs, one for each canvas. When using
	     * `'blob'` type this returns a `Promise` resolving with an array of `Blob`
	     * instances, one for each canvas.
	     */

	  }, {
	    key: "exportImage",
	    value: function exportImage(format, quality, type) {
	      if (!format) {
	        format = 'image/png';
	      }

	      if (!quality) {
	        quality = 1;
	      }

	      if (!type) {
	        type = 'dataURL';
	      }

	      return this.drawer.getImage(format, quality, type);
	    }
	    /**
	     * Cancel any fetch request currently in progress
	     */

	  }, {
	    key: "cancelAjax",
	    value: function cancelAjax() {
	      if (this.currentRequest && this.currentRequest.controller) {
	        // If the current request has a ProgressHandler, then its ReadableStream might need to be cancelled too
	        // See: Wavesurfer issue #2042
	        // See Firefox bug: https://bugzilla.mozilla.org/show_bug.cgi?id=1583815
	        if (this.currentRequest._reader) {
	          // Ignoring exceptions thrown by call to cancel()
	          this.currentRequest._reader.cancel().catch(function (err) {});
	        }

	        this.currentRequest.controller.abort();
	        this.currentRequest = null;
	      }
	    }
	    /**
	     * @private
	     */

	  }, {
	    key: "clearTmpEvents",
	    value: function clearTmpEvents() {
	      this.tmpEvents.forEach(function (e) {
	        return e.un();
	      });
	    }
	    /**
	     * Display empty waveform.
	     */

	  }, {
	    key: "empty",
	    value: function empty() {
	      if (!this.backend.isPaused()) {
	        this.stop();
	        this.backend.disconnectSource();
	      }

	      this.isReady = false;
	      this.cancelAjax();
	      this.clearTmpEvents(); // empty drawer

	      this.drawer.progress(0);
	      this.drawer.setWidth(0);
	      this.drawer.drawPeaks({
	        length: this.drawer.getWidth()
	      }, 0);
	    }
	    /**
	     * Remove events, elements and disconnect WebAudio nodes.
	     *
	     * @emits WaveSurfer#destroy
	     */

	  }, {
	    key: "destroy",
	    value: function destroy() {
	      this.destroyAllPlugins();
	      this.fireEvent('destroy');
	      this.cancelAjax();
	      this.clearTmpEvents();
	      this.unAll();

	      if (this.params.responsive !== false) {
	        window.removeEventListener('resize', this._onResize, true);
	        window.removeEventListener('orientationchange', this._onResize, true);
	      }

	      if (this.backend) {
	        this.backend.destroy(); // clears memory usage

	        this.backend = null;
	      }

	      if (this.drawer) {
	        this.drawer.destroy();
	      }

	      this.isDestroyed = true;
	      this.isReady = false;
	      this.arraybuffer = null;
	    }
	  }], [{
	    key: "create",
	    value:
	    /** @private */

	    /** @private */

	    /**
	     * Instantiate this class, call its `init` function and returns it
	     *
	     * @param {WavesurferParams} params The wavesurfer parameters
	     * @return {Object} WaveSurfer instance
	     * @example const wavesurfer = WaveSurfer.create(params);
	     */
	    function create(params) {
	      var wavesurfer = new WaveSurfer(params);
	      return wavesurfer.init();
	    }
	    /**
	     * The library version number is available as a static property of the
	     * WaveSurfer class
	     *
	     * @type {String}
	     * @example
	     * console.log('Using wavesurfer.js ' + WaveSurfer.VERSION);
	     */

	  }]);

	  return WaveSurfer;
	}(util.Observer);

	exports["default"] = WaveSurfer;

	_defineProperty(WaveSurfer, "VERSION", "6.2.0");

	_defineProperty(WaveSurfer, "util", util);

	module.exports = exports.default;

	/***/ }),

	/***/ "./src/webaudio.js":
	/*!*************************!*\
	  !*** ./src/webaudio.js ***!
	  \*************************/
	/***/ ((module, exports, __webpack_require__) => {


	function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

	Object.defineProperty(exports, "__esModule", ({
	  value: true
	}));
	exports["default"] = void 0;

	var util = _interopRequireWildcard(__webpack_require__(/*! ./util */ "./src/util/index.js"));

	function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

	function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

	function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }

	function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

	function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

	function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

	function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

	function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

	function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

	// using constants to prevent someone writing the string wrong
	var PLAYING = 'playing';
	var PAUSED = 'paused';
	var FINISHED = 'finished';
	/**
	 * WebAudio backend
	 *
	 * @extends {Observer}
	 */

	var WebAudio = /*#__PURE__*/function (_util$Observer) {
	  _inherits(WebAudio, _util$Observer);

	  var _super = _createSuper(WebAudio);

	  /**
	   * Construct the backend
	   *
	   * @param {WavesurferParams} params Wavesurfer parameters
	   */
	  function WebAudio(params) {
	    var _defineProperty2, _this$states;

	    var _this;

	    _classCallCheck(this, WebAudio);

	    _this = _super.call(this);
	    /** @private */

	    _defineProperty(_assertThisInitialized(_this), "audioContext", null);

	    _defineProperty(_assertThisInitialized(_this), "offlineAudioContext", null);

	    _defineProperty(_assertThisInitialized(_this), "stateBehaviors", (_defineProperty2 = {}, _defineProperty(_defineProperty2, PLAYING, {
	      init: function init() {
	        this.addOnAudioProcess();
	      },
	      getPlayedPercents: function getPlayedPercents() {
	        var duration = this.getDuration();
	        return this.getCurrentTime() / duration || 0;
	      },
	      getCurrentTime: function getCurrentTime() {
	        return this.startPosition + this.getPlayedTime();
	      }
	    }), _defineProperty(_defineProperty2, PAUSED, {
	      init: function init() {
	        this.removeOnAudioProcess();
	      },
	      getPlayedPercents: function getPlayedPercents() {
	        var duration = this.getDuration();
	        return this.getCurrentTime() / duration || 0;
	      },
	      getCurrentTime: function getCurrentTime() {
	        return this.startPosition;
	      }
	    }), _defineProperty(_defineProperty2, FINISHED, {
	      init: function init() {
	        this.removeOnAudioProcess();
	        this.fireEvent('finish');
	      },
	      getPlayedPercents: function getPlayedPercents() {
	        return 1;
	      },
	      getCurrentTime: function getCurrentTime() {
	        return this.getDuration();
	      }
	    }), _defineProperty2));

	    _this.params = params;
	    /** ac: Audio Context instance */

	    _this.ac = params.audioContext || (_this.supportsWebAudio() ? _this.getAudioContext() : {});
	    /**@private */

	    _this.lastPlay = _this.ac.currentTime;
	    /** @private */

	    _this.startPosition = 0;
	    /** @private */

	    _this.scheduledPause = null;
	    /** @private */

	    _this.states = (_this$states = {}, _defineProperty(_this$states, PLAYING, Object.create(_this.stateBehaviors[PLAYING])), _defineProperty(_this$states, PAUSED, Object.create(_this.stateBehaviors[PAUSED])), _defineProperty(_this$states, FINISHED, Object.create(_this.stateBehaviors[FINISHED])), _this$states);
	    /** @private */

	    _this.buffer = null;
	    /** @private */

	    _this.filters = [];
	    /** gainNode: allows to control audio volume */

	    _this.gainNode = null;
	    /** @private */

	    _this.mergedPeaks = null;
	    /** @private */

	    _this.offlineAc = null;
	    /** @private */

	    _this.peaks = null;
	    /** @private */

	    _this.playbackRate = 1;
	    /** analyser: provides audio analysis information */

	    _this.analyser = null;
	    /** scriptNode: allows processing audio */

	    _this.scriptNode = null;
	    /** @private */

	    _this.source = null;
	    /** @private */

	    _this.splitPeaks = [];
	    /** @private */

	    _this.state = null;
	    /** @private */

	    _this.explicitDuration = params.duration;
	    /** @private */

	    _this.sinkStreamDestination = null;
	    /** @private */

	    _this.sinkAudioElement = null;
	    /**
	     * Boolean indicating if the backend was destroyed.
	     */

	    _this.destroyed = false;
	    return _this;
	  }
	  /**
	   * Initialise the backend, called in `wavesurfer.createBackend()`
	   */


	  _createClass(WebAudio, [{
	    key: "supportsWebAudio",
	    value:
	    /** scriptBufferSize: size of the processing buffer */

	    /** audioContext: allows to process audio with WebAudio API */

	    /** @private */

	    /** @private */

	    /**
	     * Does the browser support this backend
	     *
	     * @return {boolean} Whether or not this browser supports this backend
	     */
	    function supportsWebAudio() {
	      return !!(window.AudioContext || window.webkitAudioContext);
	    }
	    /**
	     * Get the audio context used by this backend or create one
	     *
	     * @return {AudioContext} Existing audio context, or creates a new one
	     */

	  }, {
	    key: "getAudioContext",
	    value: function getAudioContext() {
	      if (!window.WaveSurferAudioContext) {
	        window.WaveSurferAudioContext = new (window.AudioContext || window.webkitAudioContext)();
	      }

	      return window.WaveSurferAudioContext;
	    }
	    /**
	     * Get the offline audio context used by this backend or create one
	     *
	     * @param {number} sampleRate The sample rate to use
	     * @return {OfflineAudioContext} Existing offline audio context, or creates
	     * a new one
	     */

	  }, {
	    key: "getOfflineAudioContext",
	    value: function getOfflineAudioContext(sampleRate) {
	      if (!window.WaveSurferOfflineAudioContext) {
	        window.WaveSurferOfflineAudioContext = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 2, sampleRate);
	      }

	      return window.WaveSurferOfflineAudioContext;
	    }
	  }, {
	    key: "init",
	    value: function init() {
	      this.createVolumeNode();
	      this.createScriptNode();
	      this.createAnalyserNode();
	      this.setState(PAUSED);
	      this.setPlaybackRate(this.params.audioRate);
	      this.setLength(0);
	    }
	    /** @private */

	  }, {
	    key: "disconnectFilters",
	    value: function disconnectFilters() {
	      if (this.filters) {
	        this.filters.forEach(function (filter) {
	          filter && filter.disconnect();
	        });
	        this.filters = null; // Reconnect direct path

	        this.analyser.connect(this.gainNode);
	      }
	    }
	    /**
	     * @private
	     *
	     * @param {string} state The new state
	     */

	  }, {
	    key: "setState",
	    value: function setState(state) {
	      if (this.state !== this.states[state]) {
	        this.state = this.states[state];
	        this.state.init.call(this);
	      }
	    }
	    /**
	     * Unpacked `setFilters()`
	     *
	     * @param {...AudioNode} filters One or more filters to set
	     */

	  }, {
	    key: "setFilter",
	    value: function setFilter() {
	      for (var _len = arguments.length, filters = new Array(_len), _key = 0; _key < _len; _key++) {
	        filters[_key] = arguments[_key];
	      }

	      this.setFilters(filters);
	    }
	    /**
	     * Insert custom Web Audio nodes into the graph
	     *
	     * @param {AudioNode[]} filters Packed filters array
	     * @example
	     * const lowpass = wavesurfer.backend.ac.createBiquadFilter();
	     * wavesurfer.backend.setFilter(lowpass);
	     */

	  }, {
	    key: "setFilters",
	    value: function setFilters(filters) {
	      // Remove existing filters
	      this.disconnectFilters(); // Insert filters if filter array not empty

	      if (filters && filters.length) {
	        this.filters = filters; // Disconnect direct path before inserting filters

	        this.analyser.disconnect(); // Connect each filter in turn

	        filters.reduce(function (prev, curr) {
	          prev.connect(curr);
	          return curr;
	        }, this.analyser).connect(this.gainNode);
	      }
	    }
	    /** Create ScriptProcessorNode to process audio */

	  }, {
	    key: "createScriptNode",
	    value: function createScriptNode() {
	      if (this.params.audioScriptProcessor) {
	        this.scriptNode = this.params.audioScriptProcessor;
	      } else {
	        if (this.ac.createScriptProcessor) {
	          this.scriptNode = this.ac.createScriptProcessor(WebAudio.scriptBufferSize);
	        } else {
	          this.scriptNode = this.ac.createJavaScriptNode(WebAudio.scriptBufferSize);
	        }
	      }

	      this.scriptNode.connect(this.ac.destination);
	    }
	    /** @private */

	  }, {
	    key: "addOnAudioProcess",
	    value: function addOnAudioProcess() {
	      var _this2 = this;

	      this.scriptNode.onaudioprocess = function () {
	        var time = _this2.getCurrentTime();

	        if (time >= _this2.getDuration()) {
	          _this2.setState(FINISHED);

	          _this2.fireEvent('pause');
	        } else if (time >= _this2.scheduledPause) {
	          _this2.pause();
	        } else if (_this2.state === _this2.states[PLAYING]) {
	          _this2.fireEvent('audioprocess', time);
	        }
	      };
	    }
	    /** @private */

	  }, {
	    key: "removeOnAudioProcess",
	    value: function removeOnAudioProcess() {
	      this.scriptNode.onaudioprocess = null;
	    }
	    /** Create analyser node to perform audio analysis */

	  }, {
	    key: "createAnalyserNode",
	    value: function createAnalyserNode() {
	      this.analyser = this.ac.createAnalyser();
	      this.analyser.connect(this.gainNode);
	    }
	    /**
	     * Create the gain node needed to control the playback volume.
	     *
	     */

	  }, {
	    key: "createVolumeNode",
	    value: function createVolumeNode() {
	      // Create gain node using the AudioContext
	      if (this.ac.createGain) {
	        this.gainNode = this.ac.createGain();
	      } else {
	        this.gainNode = this.ac.createGainNode();
	      } // Add the gain node to the graph


	      this.gainNode.connect(this.ac.destination);
	    }
	    /**
	     * Set the sink id for the media player
	     *
	     * @param {string} deviceId String value representing audio device id.
	     * @returns {Promise} A Promise that resolves to `undefined` when there
	     * are no errors.
	     */

	  }, {
	    key: "setSinkId",
	    value: function setSinkId(deviceId) {
	      if (deviceId) {
	        /**
	         * The webaudio API doesn't currently support setting the device
	         * output. Here we create an HTMLAudioElement, connect the
	         * webaudio stream to that element and setSinkId there.
	         */
	        if (!this.sinkAudioElement) {
	          this.sinkAudioElement = new window.Audio(); // autoplay is necessary since we're not invoking .play()

	          this.sinkAudioElement.autoplay = true;
	        }

	        if (!this.sinkAudioElement.setSinkId) {
	          return Promise.reject(new Error('setSinkId is not supported in your browser'));
	        }

	        if (!this.sinkStreamDestination) {
	          this.sinkStreamDestination = this.ac.createMediaStreamDestination();
	        }

	        this.gainNode.disconnect();
	        this.gainNode.connect(this.sinkStreamDestination);
	        this.sinkAudioElement.srcObject = this.sinkStreamDestination.stream;
	        return this.sinkAudioElement.setSinkId(deviceId);
	      } else {
	        return Promise.reject(new Error('Invalid deviceId: ' + deviceId));
	      }
	    }
	    /**
	     * Set the audio volume
	     *
	     * @param {number} value A floating point value between 0 and 1.
	     */

	  }, {
	    key: "setVolume",
	    value: function setVolume(value) {
	      this.gainNode.gain.setValueAtTime(value, this.ac.currentTime);
	    }
	    /**
	     * Get the current volume
	     *
	     * @return {number} value A floating point value between 0 and 1.
	     */

	  }, {
	    key: "getVolume",
	    value: function getVolume() {
	      return this.gainNode.gain.value;
	    }
	    /**
	     * Decode an array buffer and pass data to a callback
	     *
	     * @private
	     * @param {ArrayBuffer} arraybuffer The array buffer to decode
	     * @param {function} callback The function to call on complete.
	     * @param {function} errback The function to call on error.
	     */

	  }, {
	    key: "decodeArrayBuffer",
	    value: function decodeArrayBuffer(arraybuffer, callback, errback) {
	      if (!this.offlineAc) {
	        this.offlineAc = this.getOfflineAudioContext(this.ac && this.ac.sampleRate ? this.ac.sampleRate : 44100);
	      }

	      if ('webkitAudioContext' in window) {
	        // Safari: no support for Promise-based decodeAudioData enabled
	        // Enable it in Safari using the Experimental Features > Modern WebAudio API option
	        this.offlineAc.decodeAudioData(arraybuffer, function (data) {
	          return callback(data);
	        }, errback);
	      } else {
	        this.offlineAc.decodeAudioData(arraybuffer).then(function (data) {
	          return callback(data);
	        }).catch(function (err) {
	          return errback(err);
	        });
	      }
	    }
	    /**
	     * Set pre-decoded peaks
	     *
	     * @param {number[]|Number.<Array[]>} peaks Peaks data
	     * @param {?number} duration Explicit duration
	     */

	  }, {
	    key: "setPeaks",
	    value: function setPeaks(peaks, duration) {
	      if (duration != null) {
	        this.explicitDuration = duration;
	      }

	      this.peaks = peaks;
	    }
	    /**
	     * Set the rendered length (different from the length of the audio)
	     *
	     * @param {number} length The rendered length
	     */

	  }, {
	    key: "setLength",
	    value: function setLength(length) {
	      // No resize, we can preserve the cached peaks.
	      if (this.mergedPeaks && length == 2 * this.mergedPeaks.length - 1 + 2) {
	        return;
	      }

	      this.splitPeaks = [];
	      this.mergedPeaks = []; // Set the last element of the sparse array so the peak arrays are
	      // appropriately sized for other calculations.

	      var channels = this.buffer ? this.buffer.numberOfChannels : 1;
	      var c;

	      for (c = 0; c < channels; c++) {
	        this.splitPeaks[c] = [];
	        this.splitPeaks[c][2 * (length - 1)] = 0;
	        this.splitPeaks[c][2 * (length - 1) + 1] = 0;
	      }

	      this.mergedPeaks[2 * (length - 1)] = 0;
	      this.mergedPeaks[2 * (length - 1) + 1] = 0;
	    }
	    /**
	     * Compute the max and min value of the waveform when broken into <length> subranges.
	     *
	     * @param {number} length How many subranges to break the waveform into.
	     * @param {number} first First sample in the required range.
	     * @param {number} last Last sample in the required range.
	     * @return {number[]|Number.<Array[]>} Array of 2*<length> peaks or array of arrays of
	     * peaks consisting of (max, min) values for each subrange.
	     */

	  }, {
	    key: "getPeaks",
	    value: function getPeaks(length, first, last) {
	      if (this.peaks) {
	        return this.peaks;
	      }

	      if (!this.buffer) {
	        return [];
	      }

	      first = first || 0;
	      last = last || length - 1;
	      this.setLength(length);

	      if (!this.buffer) {
	        return this.params.splitChannels ? this.splitPeaks : this.mergedPeaks;
	      }
	      /**
	       * The following snippet fixes a buffering data issue on the Safari
	       * browser which returned undefined It creates the missing buffer based
	       * on 1 channel, 4096 samples and the sampleRate from the current
	       * webaudio context 4096 samples seemed to be the best fit for rendering
	       * will review this code once a stable version of Safari TP is out
	       */


	      if (!this.buffer.length) {
	        var newBuffer = this.createBuffer(1, 4096, this.sampleRate);
	        this.buffer = newBuffer.buffer;
	      }

	      var sampleSize = this.buffer.length / length;
	      var sampleStep = ~~(sampleSize / 10) || 1;
	      var channels = this.buffer.numberOfChannels;
	      var c;

	      for (c = 0; c < channels; c++) {
	        var peaks = this.splitPeaks[c];
	        var chan = this.buffer.getChannelData(c);
	        var i = void 0;

	        for (i = first; i <= last; i++) {
	          var start = ~~(i * sampleSize);
	          var end = ~~(start + sampleSize);
	          /**
	           * Initialize the max and min to the first sample of this
	           * subrange, so that even if the samples are entirely
	           * on one side of zero, we still return the true max and
	           * min values in the subrange.
	           */

	          var min = chan[start];
	          var max = min;
	          var j = void 0;

	          for (j = start; j < end; j += sampleStep) {
	            var value = chan[j];

	            if (value > max) {
	              max = value;
	            }

	            if (value < min) {
	              min = value;
	            }
	          }

	          peaks[2 * i] = max;
	          peaks[2 * i + 1] = min;

	          if (c == 0 || max > this.mergedPeaks[2 * i]) {
	            this.mergedPeaks[2 * i] = max;
	          }

	          if (c == 0 || min < this.mergedPeaks[2 * i + 1]) {
	            this.mergedPeaks[2 * i + 1] = min;
	          }
	        }
	      }

	      return this.params.splitChannels ? this.splitPeaks : this.mergedPeaks;
	    }
	    /**
	     * Get the position from 0 to 1
	     *
	     * @return {number} Position
	     */

	  }, {
	    key: "getPlayedPercents",
	    value: function getPlayedPercents() {
	      return this.state.getPlayedPercents.call(this);
	    }
	    /** @private */

	  }, {
	    key: "disconnectSource",
	    value: function disconnectSource() {
	      if (this.source) {
	        this.source.disconnect();
	      }
	    }
	    /**
	     * Destroy all references with WebAudio, disconnecting audio nodes and closing Audio Context
	     */

	  }, {
	    key: "destroyWebAudio",
	    value: function destroyWebAudio() {
	      this.disconnectFilters();
	      this.disconnectSource();
	      this.gainNode.disconnect();
	      this.scriptNode.disconnect();
	      this.analyser.disconnect(); // close the audioContext if closeAudioContext option is set to true

	      if (this.params.closeAudioContext) {
	        // check if browser supports AudioContext.close()
	        if (typeof this.ac.close === 'function' && this.ac.state != 'closed') {
	          this.ac.close();
	        } // clear the reference to the audiocontext


	        this.ac = null; // clear the actual audiocontext, either passed as param or the
	        // global singleton

	        if (!this.params.audioContext) {
	          window.WaveSurferAudioContext = null;
	        } else {
	          this.params.audioContext = null;
	        } // clear the offlineAudioContext


	        window.WaveSurferOfflineAudioContext = null;
	      } // disconnect resources used by setSinkId


	      if (this.sinkStreamDestination) {
	        this.sinkAudioElement.pause();
	        this.sinkAudioElement.srcObject = null;
	        this.sinkStreamDestination.disconnect();
	        this.sinkStreamDestination = null;
	      }
	    }
	    /**
	     * This is called when wavesurfer is destroyed
	     */

	  }, {
	    key: "destroy",
	    value: function destroy() {
	      if (!this.isPaused()) {
	        this.pause();
	      }

	      this.unAll();
	      this.buffer = null;
	      this.destroyed = true;
	      this.destroyWebAudio();
	    }
	    /**
	     * Loaded a decoded audio buffer
	     *
	     * @param {Object} buffer Decoded audio buffer to load
	     */

	  }, {
	    key: "load",
	    value: function load(buffer) {
	      this.startPosition = 0;
	      this.lastPlay = this.ac.currentTime;
	      this.buffer = buffer;
	      this.createSource();
	    }
	    /** @private */

	  }, {
	    key: "createSource",
	    value: function createSource() {
	      this.disconnectSource();
	      this.source = this.ac.createBufferSource(); // adjust for old browsers

	      this.source.start = this.source.start || this.source.noteGrainOn;
	      this.source.stop = this.source.stop || this.source.noteOff;
	      this.setPlaybackRate(this.playbackRate);
	      this.source.buffer = this.buffer;
	      this.source.connect(this.analyser);
	    }
	    /**
	     * @private
	     *
	     * some browsers require an explicit call to #resume before they will play back audio
	     */

	  }, {
	    key: "resumeAudioContext",
	    value: function resumeAudioContext() {
	      if (this.ac.state == 'suspended') {
	        this.ac.resume && this.ac.resume();
	      }
	    }
	    /**
	     * Used by `wavesurfer.isPlaying()` and `wavesurfer.playPause()`
	     *
	     * @return {boolean} Whether or not this backend is currently paused
	     */

	  }, {
	    key: "isPaused",
	    value: function isPaused() {
	      return this.state !== this.states[PLAYING];
	    }
	    /**
	     * Used by `wavesurfer.getDuration()`
	     *
	     * @return {number} Duration of loaded buffer
	     */

	  }, {
	    key: "getDuration",
	    value: function getDuration() {
	      if (this.explicitDuration) {
	        return this.explicitDuration;
	      }

	      if (!this.buffer) {
	        return 0;
	      }

	      return this.buffer.duration;
	    }
	    /**
	     * Used by `wavesurfer.seekTo()`
	     *
	     * @param {number} start Position to start at in seconds
	     * @param {number} end Position to end at in seconds
	     * @return {{start: number, end: number}} Object containing start and end
	     * positions
	     */

	  }, {
	    key: "seekTo",
	    value: function seekTo(start, end) {
	      if (!this.buffer) {
	        return;
	      }

	      this.scheduledPause = null;

	      if (start == null) {
	        start = this.getCurrentTime();

	        if (start >= this.getDuration()) {
	          start = 0;
	        }
	      }

	      if (end == null) {
	        end = this.getDuration();
	      }

	      this.startPosition = start;
	      this.lastPlay = this.ac.currentTime;

	      if (this.state === this.states[FINISHED]) {
	        this.setState(PAUSED);
	      }

	      return {
	        start: start,
	        end: end
	      };
	    }
	    /**
	     * Get the playback position in seconds
	     *
	     * @return {number} The playback position in seconds
	     */

	  }, {
	    key: "getPlayedTime",
	    value: function getPlayedTime() {
	      return (this.ac.currentTime - this.lastPlay) * this.playbackRate;
	    }
	    /**
	     * Plays the loaded audio region.
	     *
	     * @param {number} start Start offset in seconds, relative to the beginning
	     * of a clip.
	     * @param {number} end When to stop relative to the beginning of a clip.
	     */

	  }, {
	    key: "play",
	    value: function play(start, end) {
	      if (!this.buffer) {
	        return;
	      } // need to re-create source on each playback


	      this.createSource();
	      var adjustedTime = this.seekTo(start, end);
	      start = adjustedTime.start;
	      end = adjustedTime.end;
	      this.scheduledPause = end;
	      this.source.start(0, start);
	      this.resumeAudioContext();
	      this.setState(PLAYING);
	      this.fireEvent('play');
	    }
	    /**
	     * Pauses the loaded audio.
	     */

	  }, {
	    key: "pause",
	    value: function pause() {
	      this.scheduledPause = null;
	      this.startPosition += this.getPlayedTime();

	      try {
	        this.source && this.source.stop(0);
	      } catch (err) {// Calling stop can throw the following 2 errors:
	        // - RangeError (The value specified for when is negative.)
	        // - InvalidStateNode (The node has not been started by calling start().)
	        // We can safely ignore both errors, because:
	        // - The range is surely correct
	        // - The node might not have been started yet, in which case we just want to carry on without causing any trouble.
	      }

	      this.setState(PAUSED);
	      this.fireEvent('pause');
	    }
	    /**
	     * Returns the current time in seconds relative to the audio-clip's
	     * duration.
	     *
	     * @return {number} The current time in seconds
	     */

	  }, {
	    key: "getCurrentTime",
	    value: function getCurrentTime() {
	      return this.state.getCurrentTime.call(this);
	    }
	    /**
	     * Returns the current playback rate. (0=no playback, 1=normal playback)
	     *
	     * @return {number} The current playback rate
	     */

	  }, {
	    key: "getPlaybackRate",
	    value: function getPlaybackRate() {
	      return this.playbackRate;
	    }
	    /**
	     * Set the audio source playback rate.
	     *
	     * @param {number} value The playback rate to use
	     */

	  }, {
	    key: "setPlaybackRate",
	    value: function setPlaybackRate(value) {
	      this.playbackRate = value || 1;
	      this.source && this.source.playbackRate.setValueAtTime(this.playbackRate, this.ac.currentTime);
	    }
	    /**
	     * Set a point in seconds for playback to stop at.
	     *
	     * @param {number} end Position to end at
	     * @version 3.3.0
	     */

	  }, {
	    key: "setPlayEnd",
	    value: function setPlayEnd(end) {
	      this.scheduledPause = end;
	    }
	  }]);

	  return WebAudio;
	}(util.Observer);

	exports["default"] = WebAudio;

	_defineProperty(WebAudio, "scriptBufferSize", 256);

	module.exports = exports.default;

	/***/ }),

	/***/ "./node_modules/debounce/index.js":
	/*!****************************************!*\
	  !*** ./node_modules/debounce/index.js ***!
	  \****************************************/
	/***/ ((module) => {

	/**
	 * Returns a function, that, as long as it continues to be invoked, will not
	 * be triggered. The function will be called after it stops being called for
	 * N milliseconds. If `immediate` is passed, trigger the function on the
	 * leading edge, instead of the trailing. The function also has a property 'clear' 
	 * that is a function which will clear the timer to prevent previously scheduled executions. 
	 *
	 * @source underscore.js
	 * @see http://unscriptable.com/2009/03/20/debouncing-javascript-methods/
	 * @param {Function} function to wrap
	 * @param {Number} timeout in ms (`100`)
	 * @param {Boolean} whether to execute at the beginning (`false`)
	 * @api public
	 */
	function debounce(func, wait, immediate){
	  var timeout, args, context, timestamp, result;
	  if (null == wait) wait = 100;

	  function later() {
	    var last = Date.now() - timestamp;

	    if (last < wait && last >= 0) {
	      timeout = setTimeout(later, wait - last);
	    } else {
	      timeout = null;
	      if (!immediate) {
	        result = func.apply(context, args);
	        context = args = null;
	      }
	    }
	  }
	  var debounced = function(){
	    context = this;
	    args = arguments;
	    timestamp = Date.now();
	    var callNow = immediate && !timeout;
	    if (!timeout) timeout = setTimeout(later, wait);
	    if (callNow) {
	      result = func.apply(context, args);
	      context = args = null;
	    }

	    return result;
	  };

	  debounced.clear = function() {
	    if (timeout) {
	      clearTimeout(timeout);
	      timeout = null;
	    }
	  };
	  
	  debounced.flush = function() {
	    if (timeout) {
	      result = func.apply(context, args);
	      context = args = null;
	      
	      clearTimeout(timeout);
	      timeout = null;
	    }
	  };

	  return debounced;
	}
	// Adds compatibility for ES modules
	debounce.debounce = debounce;

	module.exports = debounce;


	/***/ })

	/******/ 	});
	/************************************************************************/
	/******/ 	// The module cache
	/******/ 	var __webpack_module_cache__ = {};
	/******/ 	
	/******/ 	// The require function
	/******/ 	function __webpack_require__(moduleId) {
	/******/ 		// Check if module is in cache
	/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
	/******/ 		if (cachedModule !== undefined) {
	/******/ 			return cachedModule.exports;
	/******/ 		}
	/******/ 		// Create a new module (and put it into the cache)
	/******/ 		var module = __webpack_module_cache__[moduleId] = {
	/******/ 			// no module.id needed
	/******/ 			// no module.loaded needed
	/******/ 			exports: {}
	/******/ 		};
	/******/ 	
	/******/ 		// Execute the module function
	/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
	/******/ 	
	/******/ 		// Return the exports of the module
	/******/ 		return module.exports;
	/******/ 	}
	/******/ 	
	/************************************************************************/
	/******/ 	
	/******/ 	// startup
	/******/ 	// Load entry module and return exports
	/******/ 	// This entry module is referenced by other modules so it can't be inlined
	/******/ 	var __webpack_exports__ = __webpack_require__("./src/wavesurfer.js");
	/******/ 	
	/******/ 	return __webpack_exports__;
	/******/ })()
	;
	});
	
} (wavesurfer));

var WaveSurfer = /*@__PURE__*/getDefaultExportFromCjs(wavesurfer.exports);

var wavesurfer_spectrogram = {exports: {}};

/*!
 * wavesurfer.js spectrogram plugin 6.2.0 (2022-05-16)
 * https://wavesurfer-js.org
 * @license BSD-3-Clause
 */

(function (module, exports) {
	(function webpackUniversalModuleDefinition(root, factory) {
		module.exports = factory();
	})(self, () => {
	return /******/ (() => { // webpackBootstrap
	/******/ 	var __webpack_modules__ = ({

	/***/ "./src/plugin/spectrogram/fft.js":
	/*!***************************************!*\
	  !*** ./src/plugin/spectrogram/fft.js ***!
	  \***************************************/
	/***/ ((module, exports) => {



	Object.defineProperty(exports, "__esModule", ({
	  value: true
	}));
	exports["default"] = FFT;

	/* eslint-disable complexity, no-redeclare, no-var, one-var */

	/**
	 * Calculate FFT - Based on https://github.com/corbanbrook/dsp.js
	 *
	 * @param {Number} bufferSize Buffer size
	 * @param {Number} sampleRate Sample rate
	 * @param {Function} windowFunc Window function
	 * @param {Number} alpha Alpha channel
	 */
	function FFT(bufferSize, sampleRate, windowFunc, alpha) {
	  this.bufferSize = bufferSize;
	  this.sampleRate = sampleRate;
	  this.bandwidth = 2 / bufferSize * (sampleRate / 2);
	  this.sinTable = new Float32Array(bufferSize);
	  this.cosTable = new Float32Array(bufferSize);
	  this.windowValues = new Float32Array(bufferSize);
	  this.reverseTable = new Uint32Array(bufferSize);
	  this.peakBand = 0;
	  this.peak = 0;
	  var i;

	  switch (windowFunc) {
	    case 'bartlett':
	      for (i = 0; i < bufferSize; i++) {
	        this.windowValues[i] = 2 / (bufferSize - 1) * ((bufferSize - 1) / 2 - Math.abs(i - (bufferSize - 1) / 2));
	      }

	      break;

	    case 'bartlettHann':
	      for (i = 0; i < bufferSize; i++) {
	        this.windowValues[i] = 0.62 - 0.48 * Math.abs(i / (bufferSize - 1) - 0.5) - 0.38 * Math.cos(Math.PI * 2 * i / (bufferSize - 1));
	      }

	      break;

	    case 'blackman':
	      alpha = alpha || 0.16;

	      for (i = 0; i < bufferSize; i++) {
	        this.windowValues[i] = (1 - alpha) / 2 - 0.5 * Math.cos(Math.PI * 2 * i / (bufferSize - 1)) + alpha / 2 * Math.cos(4 * Math.PI * i / (bufferSize - 1));
	      }

	      break;

	    case 'cosine':
	      for (i = 0; i < bufferSize; i++) {
	        this.windowValues[i] = Math.cos(Math.PI * i / (bufferSize - 1) - Math.PI / 2);
	      }

	      break;

	    case 'gauss':
	      alpha = alpha || 0.25;

	      for (i = 0; i < bufferSize; i++) {
	        this.windowValues[i] = Math.pow(Math.E, -0.5 * Math.pow((i - (bufferSize - 1) / 2) / (alpha * (bufferSize - 1) / 2), 2));
	      }

	      break;

	    case 'hamming':
	      for (i = 0; i < bufferSize; i++) {
	        this.windowValues[i] = 0.54 - 0.46 * Math.cos(Math.PI * 2 * i / (bufferSize - 1));
	      }

	      break;

	    case 'hann':
	    case undefined:
	      for (i = 0; i < bufferSize; i++) {
	        this.windowValues[i] = 0.5 * (1 - Math.cos(Math.PI * 2 * i / (bufferSize - 1)));
	      }

	      break;

	    case 'lanczoz':
	      for (i = 0; i < bufferSize; i++) {
	        this.windowValues[i] = Math.sin(Math.PI * (2 * i / (bufferSize - 1) - 1)) / (Math.PI * (2 * i / (bufferSize - 1) - 1));
	      }

	      break;

	    case 'rectangular':
	      for (i = 0; i < bufferSize; i++) {
	        this.windowValues[i] = 1;
	      }

	      break;

	    case 'triangular':
	      for (i = 0; i < bufferSize; i++) {
	        this.windowValues[i] = 2 / bufferSize * (bufferSize / 2 - Math.abs(i - (bufferSize - 1) / 2));
	      }

	      break;

	    default:
	      throw Error("No such window function '" + windowFunc + "'");
	  }

	  var limit = 1;
	  var bit = bufferSize >> 1;
	  var i;

	  while (limit < bufferSize) {
	    for (i = 0; i < limit; i++) {
	      this.reverseTable[i + limit] = this.reverseTable[i] + bit;
	    }

	    limit = limit << 1;
	    bit = bit >> 1;
	  }

	  for (i = 0; i < bufferSize; i++) {
	    this.sinTable[i] = Math.sin(-Math.PI / i);
	    this.cosTable[i] = Math.cos(-Math.PI / i);
	  }

	  this.calculateSpectrum = function (buffer) {
	    // Locally scope variables for speed up
	    var bufferSize = this.bufferSize,
	        cosTable = this.cosTable,
	        sinTable = this.sinTable,
	        reverseTable = this.reverseTable,
	        real = new Float32Array(bufferSize),
	        imag = new Float32Array(bufferSize),
	        bSi = 2 / this.bufferSize,
	        sqrt = Math.sqrt,
	        rval,
	        ival,
	        mag,
	        spectrum = new Float32Array(bufferSize / 2);
	    var k = Math.floor(Math.log(bufferSize) / Math.LN2);

	    if (Math.pow(2, k) !== bufferSize) {
	      throw 'Invalid buffer size, must be a power of 2.';
	    }

	    if (bufferSize !== buffer.length) {
	      throw 'Supplied buffer is not the same size as defined FFT. FFT Size: ' + bufferSize + ' Buffer Size: ' + buffer.length;
	    }

	    var halfSize = 1,
	        phaseShiftStepReal,
	        phaseShiftStepImag,
	        currentPhaseShiftReal,
	        currentPhaseShiftImag,
	        off,
	        tr,
	        ti,
	        tmpReal;

	    for (var i = 0; i < bufferSize; i++) {
	      real[i] = buffer[reverseTable[i]] * this.windowValues[reverseTable[i]];
	      imag[i] = 0;
	    }

	    while (halfSize < bufferSize) {
	      phaseShiftStepReal = cosTable[halfSize];
	      phaseShiftStepImag = sinTable[halfSize];
	      currentPhaseShiftReal = 1;
	      currentPhaseShiftImag = 0;

	      for (var fftStep = 0; fftStep < halfSize; fftStep++) {
	        var i = fftStep;

	        while (i < bufferSize) {
	          off = i + halfSize;
	          tr = currentPhaseShiftReal * real[off] - currentPhaseShiftImag * imag[off];
	          ti = currentPhaseShiftReal * imag[off] + currentPhaseShiftImag * real[off];
	          real[off] = real[i] - tr;
	          imag[off] = imag[i] - ti;
	          real[i] += tr;
	          imag[i] += ti;
	          i += halfSize << 1;
	        }

	        tmpReal = currentPhaseShiftReal;
	        currentPhaseShiftReal = tmpReal * phaseShiftStepReal - currentPhaseShiftImag * phaseShiftStepImag;
	        currentPhaseShiftImag = tmpReal * phaseShiftStepImag + currentPhaseShiftImag * phaseShiftStepReal;
	      }

	      halfSize = halfSize << 1;
	    }

	    for (var i = 0, N = bufferSize / 2; i < N; i++) {
	      rval = real[i];
	      ival = imag[i];
	      mag = bSi * sqrt(rval * rval + ival * ival);

	      if (mag > this.peak) {
	        this.peakBand = i;
	        this.peak = mag;
	      }

	      spectrum[i] = mag;
	    }

	    return spectrum;
	  };
	}

	module.exports = exports.default;

	/***/ }),

	/***/ "./src/plugin/spectrogram/index.js":
	/*!*****************************************!*\
	  !*** ./src/plugin/spectrogram/index.js ***!
	  \*****************************************/
	/***/ ((module, exports, __webpack_require__) => {



	Object.defineProperty(exports, "__esModule", ({
	  value: true
	}));
	exports["default"] = void 0;

	var _fft = _interopRequireDefault(__webpack_require__(/*! ./fft */ "./src/plugin/spectrogram/fft.js"));

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

	function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

	/**
	 * @typedef {Object} SpectrogramPluginParams
	 * @property {string|HTMLElement} container Selector of element or element in
	 * which to render
	 * @property {number} fftSamples=512 Number of samples to fetch to FFT. Must be
	 * a power of 2.
	 * @property {boolean} splitChannels=false Render with separate spectrograms for
	 * the channels of the audio
	 * @property {number} height=fftSamples/2 Height of the spectrogram view in CSS
	 * pixels
	 * @property {boolean} labels Set to true to display frequency labels.
	 * @property {number} noverlap Size of the overlapping window. Must be <
	 * fftSamples. Auto deduced from canvas size by default.
	 * @property {string} windowFunc='hann' The window function to be used. One of
	 * these: `'bartlett'`, `'bartlettHann'`, `'blackman'`, `'cosine'`, `'gauss'`,
	 * `'hamming'`, `'hann'`, `'lanczoz'`, `'rectangular'`, `'triangular'`
	 * @property {?number} alpha Some window functions have this extra value.
	 * (Between 0 and 1)
	 * @property {number} pixelRatio=wavesurfer.params.pixelRatio to control the
	 * size of the spectrogram in relation with its canvas. 1 = Draw on the whole
	 * canvas. 2 = Draw on a quarter (1/2 the length and 1/2 the width)
	 * @property {number} frequencyMin=0 Min frequency to scale spectrogram.
	 * @property {number} frequencyMax=12000 Max frequency to scale spectrogram.
	 * Set this to samplerate/2 to draw whole range of spectrogram.
	 * @property {?boolean} deferInit Set to true to manually call
	 * `initPlugin('spectrogram')`
	 * @property {?number[][]} colorMap A 256 long array of 4-element arrays.
	 * Each entry should contain a float between 0 and 1 and specify
	 * r, g, b, and alpha.
	 */

	/**
	 * Render a spectrogram visualisation of the audio.
	 *
	 * @implements {PluginClass}
	 * @extends {Observer}
	 * @example
	 * // es6
	 * import SpectrogramPlugin from 'wavesurfer.spectrogram.js';
	 *
	 * // commonjs
	 * var SpectrogramPlugin = require('wavesurfer.spectrogram.js');
	 *
	 * // if you are using <script> tags
	 * var SpectrogramPlugin = window.WaveSurfer.spectrogram;
	 *
	 * // ... initialising wavesurfer with the plugin
	 * var wavesurfer = WaveSurfer.create({
	 *   // wavesurfer options ...
	 *   plugins: [
	 *     SpectrogramPlugin.create({
	 *       // plugin options ...
	 *     })
	 *   ]
	 * });
	 */
	var SpectrogramPlugin = /*#__PURE__*/function () {
	  function SpectrogramPlugin(params, ws) {
	    var _this = this;

	    _classCallCheck(this, SpectrogramPlugin);

	    this.params = params;
	    this.wavesurfer = ws;
	    this.util = ws.util;
	    this.frequenciesDataUrl = params.frequenciesDataUrl;

	    this._onScroll = function (e) {
	      _this.updateScroll(e);
	    };

	    this._onRender = function () {
	      _this.render();
	    };

	    this._onWrapperClick = function (e) {
	      _this._wrapperClickHandler(e);
	    };

	    this._onReady = function () {
	      var drawer = _this.drawer = ws.drawer;
	      _this.container = 'string' == typeof params.container ? document.querySelector(params.container) : params.container;

	      if (!_this.container) {
	        throw Error('No container for WaveSurfer spectrogram');
	      }

	      if (params.colorMap) {
	        if (params.colorMap.length < 256) {
	          throw new Error('Colormap must contain 256 elements');
	        }

	        for (var i = 0; i < params.colorMap.length; i++) {
	          var cmEntry = params.colorMap[i];

	          if (cmEntry.length !== 4) {
	            throw new Error('ColorMap entries must contain 4 values');
	          }
	        }

	        _this.colorMap = params.colorMap;
	      } else {
	        _this.colorMap = [];

	        for (var _i = 0; _i < 256; _i++) {
	          var val = (255 - _i) / 256;

	          _this.colorMap.push([val, val, val, 1]);
	        }
	      }

	      _this.width = drawer.width;
	      _this.pixelRatio = _this.params.pixelRatio || ws.params.pixelRatio;
	      _this.fftSamples = _this.params.fftSamples || ws.params.fftSamples || 512;
	      _this.height = _this.params.height || _this.fftSamples / 2;
	      _this.noverlap = params.noverlap;
	      _this.windowFunc = params.windowFunc;
	      _this.alpha = params.alpha;
	      _this.splitChannels = params.splitChannels;
	      _this.channels = _this.splitChannels ? ws.backend.buffer.numberOfChannels : 1; // Getting file's original samplerate is difficult(#1248).
	      // So set 12kHz default to render like wavesurfer.js 5.x.

	      _this.frequencyMin = params.frequencyMin || 0;
	      _this.frequencyMax = params.frequencyMax || 12000;

	      _this.createWrapper();

	      _this.createCanvas();

	      _this.render();

	      drawer.wrapper.addEventListener('scroll', _this._onScroll);
	      ws.on('redraw', _this._onRender);
	    };
	  }

	  _createClass(SpectrogramPlugin, [{
	    key: "init",
	    value: function init() {
	      // Check if wavesurfer is ready
	      if (this.wavesurfer.isReady) {
	        this._onReady();
	      } else {
	        this.wavesurfer.once('ready', this._onReady);
	      }
	    }
	  }, {
	    key: "destroy",
	    value: function destroy() {
	      this.unAll();
	      this.wavesurfer.un('ready', this._onReady);
	      this.wavesurfer.un('redraw', this._onRender);
	      this.drawer && this.drawer.wrapper.removeEventListener('scroll', this._onScroll);
	      this.wavesurfer = null;
	      this.util = null;
	      this.params = null;

	      if (this.wrapper) {
	        this.wrapper.removeEventListener('click', this._onWrapperClick);
	        this.wrapper.parentNode.removeChild(this.wrapper);
	        this.wrapper = null;
	      }
	    }
	  }, {
	    key: "createWrapper",
	    value: function createWrapper() {
	      var prevSpectrogram = this.container.querySelector('spectrogram');

	      if (prevSpectrogram) {
	        this.container.removeChild(prevSpectrogram);
	      }

	      var wsParams = this.wavesurfer.params;
	      this.wrapper = document.createElement('spectrogram'); // if labels are active

	      if (this.params.labels) {
	        var labelsEl = this.labelsEl = document.createElement('canvas');
	        labelsEl.classList.add('spec-labels');
	        this.drawer.style(labelsEl, {
	          position: 'fixed',
	          zIndex: 9,
	          height: "".concat(this.height * this.channels, "px"),
	          width: "55px"
	        });
	        this.wrapper.appendChild(labelsEl);
	        this.loadLabels('rgba(68,68,68,0.5)', '12px', '10px', '', '#fff', '#f7f7f7', 'center', '#specLabels');
	      }

	      this.drawer.style(this.wrapper, {
	        display: 'block',
	        position: 'relative',
	        userSelect: 'none',
	        webkitUserSelect: 'none',
	        height: "".concat(this.height * this.channels, "px")
	      });

	      if (wsParams.fillParent || wsParams.scrollParent) {
	        this.drawer.style(this.wrapper, {
	          width: '100%',
	          overflowX: 'hidden',
	          overflowY: 'hidden'
	        });
	      }

	      this.container.appendChild(this.wrapper);
	      this.wrapper.addEventListener('click', this._onWrapperClick);
	    }
	  }, {
	    key: "_wrapperClickHandler",
	    value: function _wrapperClickHandler(event) {
	      event.preventDefault();
	      var relX = 'offsetX' in event ? event.offsetX : event.layerX;
	      this.fireEvent('click', relX / this.width || 0);
	    }
	  }, {
	    key: "createCanvas",
	    value: function createCanvas() {
	      var canvas = this.canvas = this.wrapper.appendChild(document.createElement('canvas'));
	      this.spectrCc = canvas.getContext('2d');
	      this.util.style(canvas, {
	        position: 'absolute',
	        zIndex: 4
	      });
	    }
	  }, {
	    key: "render",
	    value: function render() {
	      this.updateCanvasStyle();

	      if (this.frequenciesDataUrl) {
	        this.loadFrequenciesData(this.frequenciesDataUrl);
	      } else {
	        this.getFrequencies(this.drawSpectrogram);
	      }
	    }
	  }, {
	    key: "updateCanvasStyle",
	    value: function updateCanvasStyle() {
	      var width = Math.round(this.width / this.pixelRatio) + 'px';
	      this.canvas.width = this.width;
	      this.canvas.height = this.fftSamples / 2 * this.channels;
	      this.canvas.style.width = width;
	      this.canvas.style.height = this.height + 'px';
	    }
	  }, {
	    key: "drawSpectrogram",
	    value: function drawSpectrogram(frequenciesData, my) {
	      if (!isNaN(frequenciesData[0][0])) {
	        // data is 1ch [sample, freq] format
	        // to [channel, sample, freq] format
	        frequenciesData = [frequenciesData];
	      }

	      var spectrCc = my.spectrCc;
	      var height = my.fftSamples / 2;
	      var width = my.width;
	      var freqFrom = my.buffer.sampleRate / 2;
	      var freqMin = my.frequencyMin;
	      var freqMax = my.frequencyMax;

	      if (!spectrCc) {
	        return;
	      }

	      var _loop = function _loop(c) {
	        // for each channel
	        var pixels = my.resample(frequenciesData[c]);
	        var imageData = new ImageData(width, height);

	        for (var i = 0; i < pixels.length; i++) {
	          for (var j = 0; j < pixels[i].length; j++) {
	            var colorMap = my.colorMap[pixels[i][j]];
	            var redIndex = ((height - j) * width + i) * 4;
	            imageData.data[redIndex] = colorMap[0] * 255;
	            imageData.data[redIndex + 1] = colorMap[1] * 255;
	            imageData.data[redIndex + 2] = colorMap[2] * 255;
	            imageData.data[redIndex + 3] = colorMap[3] * 255;
	          }
	        } // scale and stack spectrograms


	        createImageBitmap(imageData).then(function (renderer) {
	          return spectrCc.drawImage(renderer, 0, height * (1 - freqMax / freqFrom), // source x, y
	          width, height * (freqMax - freqMin) / freqFrom, // source width, height
	          0, height * c, // destination x, y
	          width, height // destination width, height
	          );
	        });
	      };

	      for (var c = 0; c < frequenciesData.length; c++) {
	        _loop(c);
	      }
	    }
	  }, {
	    key: "getFrequencies",
	    value: function getFrequencies(callback) {
	      var fftSamples = this.fftSamples;
	      var buffer = this.buffer = this.wavesurfer.backend.buffer;
	      var channels = this.channels;

	      if (!buffer) {
	        this.fireEvent('error', 'Web Audio buffer is not available');
	        return;
	      } // This may differ from file samplerate. Browser resamples audio.


	      var sampleRate = buffer.sampleRate;
	      var frequencies = [];
	      var noverlap = this.noverlap;

	      if (!noverlap) {
	        var uniqueSamplesPerPx = buffer.length / this.canvas.width;
	        noverlap = Math.max(0, Math.round(fftSamples - uniqueSamplesPerPx));
	      }

	      var fft = new _fft.default(fftSamples, sampleRate, this.windowFunc, this.alpha);

	      for (var c = 0; c < channels; c++) {
	        // for each channel
	        var channelData = buffer.getChannelData(c);
	        var channelFreq = [];
	        var currentOffset = 0;

	        while (currentOffset + fftSamples < channelData.length) {
	          var segment = channelData.slice(currentOffset, currentOffset + fftSamples);
	          var spectrum = fft.calculateSpectrum(segment);
	          var array = new Uint8Array(fftSamples / 2);
	          var j = void 0;

	          for (j = 0; j < fftSamples / 2; j++) {
	            array[j] = Math.max(-255, Math.log10(spectrum[j]) * 45);
	          }

	          channelFreq.push(array); // channelFreq: [sample, freq]

	          currentOffset += fftSamples - noverlap;
	        }

	        frequencies.push(channelFreq); // frequencies: [channel, sample, freq]
	      }

	      callback(frequencies, this);
	    }
	  }, {
	    key: "loadFrequenciesData",
	    value: function loadFrequenciesData(url) {
	      var _this2 = this;

	      var request = this.util.fetchFile({
	        url: url
	      });
	      request.on('success', function (data) {
	        return _this2.drawSpectrogram(JSON.parse(data), _this2);
	      });
	      request.on('error', function (e) {
	        return _this2.fireEvent('error', e);
	      });
	      return request;
	    }
	  }, {
	    key: "freqType",
	    value: function freqType(freq) {
	      return freq >= 1000 ? (freq / 1000).toFixed(1) : Math.round(freq);
	    }
	  }, {
	    key: "unitType",
	    value: function unitType(freq) {
	      return freq >= 1000 ? 'KHz' : 'Hz';
	    }
	  }, {
	    key: "loadLabels",
	    value: function loadLabels(bgFill, fontSizeFreq, fontSizeUnit, fontType, textColorFreq, textColorUnit, textAlign, container) {
	      var frequenciesHeight = this.height;
	      bgFill = bgFill || 'rgba(68,68,68,0)';
	      fontSizeFreq = fontSizeFreq || '12px';
	      fontSizeUnit = fontSizeUnit || '10px';
	      fontType = fontType || 'Helvetica';
	      textColorFreq = textColorFreq || '#fff';
	      textColorUnit = textColorUnit || '#fff';
	      textAlign = textAlign || 'center';
	      var bgWidth = 55;
	      var getMaxY = frequenciesHeight || 512;
	      var labelIndex = 5 * (getMaxY / 256);
	      var freqStart = this.frequencyMin;
	      var step = (this.frequencyMax - freqStart) / labelIndex; // prepare canvas element for labels

	      var ctx = this.labelsEl.getContext('2d');
	      var dispScale = window.devicePixelRatio;
	      this.labelsEl.height = this.height * this.channels * dispScale;
	      this.labelsEl.width = bgWidth * dispScale;
	      ctx.scale(dispScale, dispScale);

	      if (!ctx) {
	        return;
	      }

	      for (var c = 0; c < this.channels; c++) {
	        // for each channel
	        // fill background
	        ctx.fillStyle = bgFill;
	        ctx.fillRect(0, c * getMaxY, bgWidth, (1 + c) * getMaxY);
	        ctx.fill();
	        var i = void 0; // render labels

	        for (i = 0; i <= labelIndex; i++) {
	          ctx.textAlign = textAlign;
	          ctx.textBaseline = 'middle';
	          var freq = freqStart + step * i;
	          var label = this.freqType(freq);
	          var units = this.unitType(freq);
	          var yLabelOffset = 2;
	          var x = 16;
	          var y = void 0;

	          if (i == 0) {
	            y = (1 + c) * getMaxY + i - 10; // unit label

	            ctx.fillStyle = textColorUnit;
	            ctx.font = fontSizeUnit + ' ' + fontType;
	            ctx.fillText(units, x + 24, y); // freq label

	            ctx.fillStyle = textColorFreq;
	            ctx.font = fontSizeFreq + ' ' + fontType;
	            ctx.fillText(label, x, y);
	          } else {
	            y = (1 + c) * getMaxY - i * 50 + yLabelOffset; // unit label

	            ctx.fillStyle = textColorUnit;
	            ctx.font = fontSizeUnit + ' ' + fontType;
	            ctx.fillText(units, x + 24, y); // freq label

	            ctx.fillStyle = textColorFreq;
	            ctx.font = fontSizeFreq + ' ' + fontType;
	            ctx.fillText(label, x, y);
	          }
	        }
	      }
	    }
	  }, {
	    key: "updateScroll",
	    value: function updateScroll(e) {
	      if (this.wrapper) {
	        this.wrapper.scrollLeft = e.target.scrollLeft;
	      }
	    }
	  }, {
	    key: "resample",
	    value: function resample(oldMatrix) {
	      var columnsNumber = this.width;
	      var newMatrix = [];
	      var oldPiece = 1 / oldMatrix.length;
	      var newPiece = 1 / columnsNumber;
	      var i;

	      for (i = 0; i < columnsNumber; i++) {
	        var column = new Array(oldMatrix[0].length);
	        var j = void 0;

	        for (j = 0; j < oldMatrix.length; j++) {
	          var oldStart = j * oldPiece;
	          var oldEnd = oldStart + oldPiece;
	          var newStart = i * newPiece;
	          var newEnd = newStart + newPiece;
	          var overlap = oldEnd <= newStart || newEnd <= oldStart ? 0 : Math.min(Math.max(oldEnd, newStart), Math.max(newEnd, oldStart)) - Math.max(Math.min(oldEnd, newStart), Math.min(newEnd, oldStart));
	          var k = void 0;
	          /* eslint-disable max-depth */

	          if (overlap > 0) {
	            for (k = 0; k < oldMatrix[0].length; k++) {
	              if (column[k] == null) {
	                column[k] = 0;
	              }

	              column[k] += overlap / newPiece * oldMatrix[j][k];
	            }
	          }
	          /* eslint-enable max-depth */

	        }

	        var intColumn = new Uint8Array(oldMatrix[0].length);
	        var m = void 0;

	        for (m = 0; m < oldMatrix[0].length; m++) {
	          intColumn[m] = column[m];
	        }

	        newMatrix.push(intColumn);
	      }

	      return newMatrix;
	    }
	  }], [{
	    key: "create",
	    value:
	    /**
	     * Spectrogram plugin definition factory
	     *
	     * This function must be used to create a plugin definition which can be
	     * used by wavesurfer to correctly instantiate the plugin.
	     *
	     * @param  {SpectrogramPluginParams} params Parameters used to initialise the plugin
	     * @return {PluginDefinition} An object representing the plugin.
	     */
	    function create(params) {
	      return {
	        name: 'spectrogram',
	        deferInit: params && params.deferInit ? params.deferInit : false,
	        params: params,
	        staticProps: {
	          FFT: _fft.default
	        },
	        instance: SpectrogramPlugin
	      };
	    }
	  }]);

	  return SpectrogramPlugin;
	}();

	exports["default"] = SpectrogramPlugin;
	module.exports = exports.default;

	/***/ })

	/******/ 	});
	/************************************************************************/
	/******/ 	// The module cache
	/******/ 	var __webpack_module_cache__ = {};
	/******/ 	
	/******/ 	// The require function
	/******/ 	function __webpack_require__(moduleId) {
	/******/ 		// Check if module is in cache
	/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
	/******/ 		if (cachedModule !== undefined) {
	/******/ 			return cachedModule.exports;
	/******/ 		}
	/******/ 		// Create a new module (and put it into the cache)
	/******/ 		var module = __webpack_module_cache__[moduleId] = {
	/******/ 			// no module.id needed
	/******/ 			// no module.loaded needed
	/******/ 			exports: {}
	/******/ 		};
	/******/ 	
	/******/ 		// Execute the module function
	/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
	/******/ 	
	/******/ 		// Return the exports of the module
	/******/ 		return module.exports;
	/******/ 	}
	/******/ 	
	/************************************************************************/
	/******/ 	
	/******/ 	// startup
	/******/ 	// Load entry module and return exports
	/******/ 	// This entry module is referenced by other modules so it can't be inlined
	/******/ 	var __webpack_exports__ = __webpack_require__("./src/plugin/spectrogram/index.js");
	/******/ 	
	/******/ 	return __webpack_exports__;
	/******/ })()
	;
	});
	
} (wavesurfer_spectrogram));

var SpectrogramPlugin = /*@__PURE__*/getDefaultExportFromCjs(wavesurfer_spectrogram.exports);

var colorScale$1={
	"jet":[{"index":0,"rgb":[0,0,131]},{"index":0.125,"rgb":[0,60,170]},{"index":0.375,"rgb":[5,255,255]},{"index":0.625,"rgb":[255,255,0]},{"index":0.875,"rgb":[250,0,0]},{"index":1,"rgb":[128,0,0]}],

	"hsv":[{"index":0,"rgb":[255,0,0]},{"index":0.169,"rgb":[253,255,2]},{"index":0.173,"rgb":[247,255,2]},{"index":0.337,"rgb":[0,252,4]},{"index":0.341,"rgb":[0,252,10]},{"index":0.506,"rgb":[1,249,255]},{"index":0.671,"rgb":[2,0,253]},{"index":0.675,"rgb":[8,0,253]},{"index":0.839,"rgb":[255,0,251]},{"index":0.843,"rgb":[255,0,245]},{"index":1,"rgb":[255,0,6]}],

	"hot":[{"index":0,"rgb":[0,0,0]},{"index":0.3,"rgb":[230,0,0]},{"index":0.6,"rgb":[255,210,0]},{"index":1,"rgb":[255,255,255]}],

	"spring":[{"index":0,"rgb":[255,0,255]},{"index":1,"rgb":[255,255,0]}],

	"summer":[{"index":0,"rgb":[0,128,102]},{"index":1,"rgb":[255,255,102]}],

	"autumn":[{"index":0,"rgb":[255,0,0]},{"index":1,"rgb":[255,255,0]}],

	"winter":[{"index":0,"rgb":[0,0,255]},{"index":1,"rgb":[0,255,128]}],

	"bone":[{"index":0,"rgb":[0,0,0]},{"index":0.376,"rgb":[84,84,116]},{"index":0.753,"rgb":[169,200,200]},{"index":1,"rgb":[255,255,255]}],

	"copper":[{"index":0,"rgb":[0,0,0]},{"index":0.804,"rgb":[255,160,102]},{"index":1,"rgb":[255,199,127]}],

	"greys":[{"index":0,"rgb":[0,0,0]},{"index":1,"rgb":[255,255,255]}],

	"yignbu":[{"index":0,"rgb":[8,29,88]},{"index":0.125,"rgb":[37,52,148]},{"index":0.25,"rgb":[34,94,168]},{"index":0.375,"rgb":[29,145,192]},{"index":0.5,"rgb":[65,182,196]},{"index":0.625,"rgb":[127,205,187]},{"index":0.75,"rgb":[199,233,180]},{"index":0.875,"rgb":[237,248,217]},{"index":1,"rgb":[255,255,217]}],

	"greens":[{"index":0,"rgb":[0,68,27]},{"index":0.125,"rgb":[0,109,44]},{"index":0.25,"rgb":[35,139,69]},{"index":0.375,"rgb":[65,171,93]},{"index":0.5,"rgb":[116,196,118]},{"index":0.625,"rgb":[161,217,155]},{"index":0.75,"rgb":[199,233,192]},{"index":0.875,"rgb":[229,245,224]},{"index":1,"rgb":[247,252,245]}],

	"yiorrd":[{"index":0,"rgb":[128,0,38]},{"index":0.125,"rgb":[189,0,38]},{"index":0.25,"rgb":[227,26,28]},{"index":0.375,"rgb":[252,78,42]},{"index":0.5,"rgb":[253,141,60]},{"index":0.625,"rgb":[254,178,76]},{"index":0.75,"rgb":[254,217,118]},{"index":0.875,"rgb":[255,237,160]},{"index":1,"rgb":[255,255,204]}],

	"bluered":[{"index":0,"rgb":[0,0,255]},{"index":1,"rgb":[255,0,0]}],

	"rdbu":[{"index":0,"rgb":[5,10,172]},{"index":0.35,"rgb":[106,137,247]},{"index":0.5,"rgb":[190,190,190]},{"index":0.6,"rgb":[220,170,132]},{"index":0.7,"rgb":[230,145,90]},{"index":1,"rgb":[178,10,28]}],

	"picnic":[{"index":0,"rgb":[0,0,255]},{"index":0.1,"rgb":[51,153,255]},{"index":0.2,"rgb":[102,204,255]},{"index":0.3,"rgb":[153,204,255]},{"index":0.4,"rgb":[204,204,255]},{"index":0.5,"rgb":[255,255,255]},{"index":0.6,"rgb":[255,204,255]},{"index":0.7,"rgb":[255,153,255]},{"index":0.8,"rgb":[255,102,204]},{"index":0.9,"rgb":[255,102,102]},{"index":1,"rgb":[255,0,0]}],

	"rainbow":[{"index":0,"rgb":[150,0,90]},{"index":0.125,"rgb":[0,0,200]},{"index":0.25,"rgb":[0,25,255]},{"index":0.375,"rgb":[0,152,255]},{"index":0.5,"rgb":[44,255,150]},{"index":0.625,"rgb":[151,255,0]},{"index":0.75,"rgb":[255,234,0]},{"index":0.875,"rgb":[255,111,0]},{"index":1,"rgb":[255,0,0]}],

	"portland":[{"index":0,"rgb":[12,51,131]},{"index":0.25,"rgb":[10,136,186]},{"index":0.5,"rgb":[242,211,56]},{"index":0.75,"rgb":[242,143,56]},{"index":1,"rgb":[217,30,30]}],

	"blackbody":[{"index":0,"rgb":[0,0,0]},{"index":0.2,"rgb":[230,0,0]},{"index":0.4,"rgb":[230,210,0]},{"index":0.7,"rgb":[255,255,255]},{"index":1,"rgb":[160,200,255]}],

	"earth":[{"index":0,"rgb":[0,0,130]},{"index":0.1,"rgb":[0,180,180]},{"index":0.2,"rgb":[40,210,40]},{"index":0.4,"rgb":[230,230,50]},{"index":0.6,"rgb":[120,70,20]},{"index":1,"rgb":[255,255,255]}],

	"electric":[{"index":0,"rgb":[0,0,0]},{"index":0.15,"rgb":[30,0,100]},{"index":0.4,"rgb":[120,0,100]},{"index":0.6,"rgb":[160,90,0]},{"index":0.8,"rgb":[230,200,0]},{"index":1,"rgb":[255,250,220]}],

	"alpha": [{"index":0, "rgb": [255,255,255,0]},{"index":1, "rgb": [255,255,255,1]}],

	"viridis": [{"index":0,"rgb":[68,1,84]},{"index":0.13,"rgb":[71,44,122]},{"index":0.25,"rgb":[59,81,139]},{"index":0.38,"rgb":[44,113,142]},{"index":0.5,"rgb":[33,144,141]},{"index":0.63,"rgb":[39,173,129]},{"index":0.75,"rgb":[92,200,99]},{"index":0.88,"rgb":[170,220,50]},{"index":1,"rgb":[253,231,37]}],

	"inferno": [{"index":0,"rgb":[0,0,4]},{"index":0.13,"rgb":[31,12,72]},{"index":0.25,"rgb":[85,15,109]},{"index":0.38,"rgb":[136,34,106]},{"index":0.5,"rgb":[186,54,85]},{"index":0.63,"rgb":[227,89,51]},{"index":0.75,"rgb":[249,140,10]},{"index":0.88,"rgb":[249,201,50]},{"index":1,"rgb":[252,255,164]}],

	"magma": [{"index":0,"rgb":[0,0,4]},{"index":0.13,"rgb":[28,16,68]},{"index":0.25,"rgb":[79,18,123]},{"index":0.38,"rgb":[129,37,129]},{"index":0.5,"rgb":[181,54,122]},{"index":0.63,"rgb":[229,80,100]},{"index":0.75,"rgb":[251,135,97]},{"index":0.88,"rgb":[254,194,135]},{"index":1,"rgb":[252,253,191]}],

	"plasma": [{"index":0,"rgb":[13,8,135]},{"index":0.13,"rgb":[75,3,161]},{"index":0.25,"rgb":[125,3,168]},{"index":0.38,"rgb":[168,34,150]},{"index":0.5,"rgb":[203,70,121]},{"index":0.63,"rgb":[229,107,93]},{"index":0.75,"rgb":[248,148,65]},{"index":0.88,"rgb":[253,195,40]},{"index":1,"rgb":[240,249,33]}],

	"warm": [{"index":0,"rgb":[125,0,179]},{"index":0.13,"rgb":[172,0,187]},{"index":0.25,"rgb":[219,0,170]},{"index":0.38,"rgb":[255,0,130]},{"index":0.5,"rgb":[255,63,74]},{"index":0.63,"rgb":[255,123,0]},{"index":0.75,"rgb":[234,176,0]},{"index":0.88,"rgb":[190,228,0]},{"index":1,"rgb":[147,255,0]}],

	"cool": [{"index":0,"rgb":[125,0,179]},{"index":0.13,"rgb":[116,0,218]},{"index":0.25,"rgb":[98,74,237]},{"index":0.38,"rgb":[68,146,231]},{"index":0.5,"rgb":[0,204,197]},{"index":0.63,"rgb":[0,247,146]},{"index":0.75,"rgb":[0,255,88]},{"index":0.88,"rgb":[40,255,8]},{"index":1,"rgb":[147,255,0]}],

	"rainbow-soft": [{"index":0,"rgb":[125,0,179]},{"index":0.1,"rgb":[199,0,180]},{"index":0.2,"rgb":[255,0,121]},{"index":0.3,"rgb":[255,108,0]},{"index":0.4,"rgb":[222,194,0]},{"index":0.5,"rgb":[150,255,0]},{"index":0.6,"rgb":[0,255,55]},{"index":0.7,"rgb":[0,246,150]},{"index":0.8,"rgb":[50,167,222]},{"index":0.9,"rgb":[103,51,235]},{"index":1,"rgb":[124,0,186]}],

	"bathymetry": [{"index":0,"rgb":[40,26,44]},{"index":0.13,"rgb":[59,49,90]},{"index":0.25,"rgb":[64,76,139]},{"index":0.38,"rgb":[63,110,151]},{"index":0.5,"rgb":[72,142,158]},{"index":0.63,"rgb":[85,174,163]},{"index":0.75,"rgb":[120,206,163]},{"index":0.88,"rgb":[187,230,172]},{"index":1,"rgb":[253,254,204]}],

	"cdom": [{"index":0,"rgb":[47,15,62]},{"index":0.13,"rgb":[87,23,86]},{"index":0.25,"rgb":[130,28,99]},{"index":0.38,"rgb":[171,41,96]},{"index":0.5,"rgb":[206,67,86]},{"index":0.63,"rgb":[230,106,84]},{"index":0.75,"rgb":[242,149,103]},{"index":0.88,"rgb":[249,193,135]},{"index":1,"rgb":[254,237,176]}],

	"chlorophyll": [{"index":0,"rgb":[18,36,20]},{"index":0.13,"rgb":[25,63,41]},{"index":0.25,"rgb":[24,91,59]},{"index":0.38,"rgb":[13,119,72]},{"index":0.5,"rgb":[18,148,80]},{"index":0.63,"rgb":[80,173,89]},{"index":0.75,"rgb":[132,196,122]},{"index":0.88,"rgb":[175,221,162]},{"index":1,"rgb":[215,249,208]}],

	"density": [{"index":0,"rgb":[54,14,36]},{"index":0.13,"rgb":[89,23,80]},{"index":0.25,"rgb":[110,45,132]},{"index":0.38,"rgb":[120,77,178]},{"index":0.5,"rgb":[120,113,213]},{"index":0.63,"rgb":[115,151,228]},{"index":0.75,"rgb":[134,185,227]},{"index":0.88,"rgb":[177,214,227]},{"index":1,"rgb":[230,241,241]}],

	"freesurface-blue": [{"index":0,"rgb":[30,4,110]},{"index":0.13,"rgb":[47,14,176]},{"index":0.25,"rgb":[41,45,236]},{"index":0.38,"rgb":[25,99,212]},{"index":0.5,"rgb":[68,131,200]},{"index":0.63,"rgb":[114,156,197]},{"index":0.75,"rgb":[157,181,203]},{"index":0.88,"rgb":[200,208,216]},{"index":1,"rgb":[241,237,236]}],

	"freesurface-red": [{"index":0,"rgb":[60,9,18]},{"index":0.13,"rgb":[100,17,27]},{"index":0.25,"rgb":[142,20,29]},{"index":0.38,"rgb":[177,43,27]},{"index":0.5,"rgb":[192,87,63]},{"index":0.63,"rgb":[205,125,105]},{"index":0.75,"rgb":[216,162,148]},{"index":0.88,"rgb":[227,199,193]},{"index":1,"rgb":[241,237,236]}],

	"oxygen": [{"index":0,"rgb":[64,5,5]},{"index":0.13,"rgb":[106,6,15]},{"index":0.25,"rgb":[144,26,7]},{"index":0.38,"rgb":[168,64,3]},{"index":0.5,"rgb":[188,100,4]},{"index":0.63,"rgb":[206,136,11]},{"index":0.75,"rgb":[220,174,25]},{"index":0.88,"rgb":[231,215,44]},{"index":1,"rgb":[248,254,105]}],

	"par": [{"index":0,"rgb":[51,20,24]},{"index":0.13,"rgb":[90,32,35]},{"index":0.25,"rgb":[129,44,34]},{"index":0.38,"rgb":[159,68,25]},{"index":0.5,"rgb":[182,99,19]},{"index":0.63,"rgb":[199,134,22]},{"index":0.75,"rgb":[212,171,35]},{"index":0.88,"rgb":[221,210,54]},{"index":1,"rgb":[225,253,75]}],

	"phase": [{"index":0,"rgb":[145,105,18]},{"index":0.13,"rgb":[184,71,38]},{"index":0.25,"rgb":[186,58,115]},{"index":0.38,"rgb":[160,71,185]},{"index":0.5,"rgb":[110,97,218]},{"index":0.63,"rgb":[50,123,164]},{"index":0.75,"rgb":[31,131,110]},{"index":0.88,"rgb":[77,129,34]},{"index":1,"rgb":[145,105,18]}],

	"salinity": [{"index":0,"rgb":[42,24,108]},{"index":0.13,"rgb":[33,50,162]},{"index":0.25,"rgb":[15,90,145]},{"index":0.38,"rgb":[40,118,137]},{"index":0.5,"rgb":[59,146,135]},{"index":0.63,"rgb":[79,175,126]},{"index":0.75,"rgb":[120,203,104]},{"index":0.88,"rgb":[193,221,100]},{"index":1,"rgb":[253,239,154]}],

	"temperature": [{"index":0,"rgb":[4,35,51]},{"index":0.13,"rgb":[23,51,122]},{"index":0.25,"rgb":[85,59,157]},{"index":0.38,"rgb":[129,79,143]},{"index":0.5,"rgb":[175,95,130]},{"index":0.63,"rgb":[222,112,101]},{"index":0.75,"rgb":[249,146,66]},{"index":0.88,"rgb":[249,196,65]},{"index":1,"rgb":[232,250,91]}],

	"turbidity": [{"index":0,"rgb":[34,31,27]},{"index":0.13,"rgb":[65,50,41]},{"index":0.25,"rgb":[98,69,52]},{"index":0.38,"rgb":[131,89,57]},{"index":0.5,"rgb":[161,112,59]},{"index":0.63,"rgb":[185,140,66]},{"index":0.75,"rgb":[202,174,88]},{"index":0.88,"rgb":[216,209,126]},{"index":1,"rgb":[233,246,171]}],

	"velocity-blue": [{"index":0,"rgb":[17,32,64]},{"index":0.13,"rgb":[35,52,116]},{"index":0.25,"rgb":[29,81,156]},{"index":0.38,"rgb":[31,113,162]},{"index":0.5,"rgb":[50,144,169]},{"index":0.63,"rgb":[87,173,176]},{"index":0.75,"rgb":[149,196,189]},{"index":0.88,"rgb":[203,221,211]},{"index":1,"rgb":[254,251,230]}],

	"velocity-green": [{"index":0,"rgb":[23,35,19]},{"index":0.13,"rgb":[24,64,38]},{"index":0.25,"rgb":[11,95,45]},{"index":0.38,"rgb":[39,123,35]},{"index":0.5,"rgb":[95,146,12]},{"index":0.63,"rgb":[152,165,18]},{"index":0.75,"rgb":[201,186,69]},{"index":0.88,"rgb":[233,216,137]},{"index":1,"rgb":[255,253,205]}],

	"cubehelix": [{"index":0,"rgb":[0,0,0]},{"index":0.07,"rgb":[22,5,59]},{"index":0.13,"rgb":[60,4,105]},{"index":0.2,"rgb":[109,1,135]},{"index":0.27,"rgb":[161,0,147]},{"index":0.33,"rgb":[210,2,142]},{"index":0.4,"rgb":[251,11,123]},{"index":0.47,"rgb":[255,29,97]},{"index":0.53,"rgb":[255,54,69]},{"index":0.6,"rgb":[255,85,46]},{"index":0.67,"rgb":[255,120,34]},{"index":0.73,"rgb":[255,157,37]},{"index":0.8,"rgb":[241,191,57]},{"index":0.87,"rgb":[224,220,93]},{"index":0.93,"rgb":[218,241,142]},{"index":1,"rgb":[227,253,198]}]
};

function lerp$1(v0, v1, t) {
    return v0*(1-t)+v1*t
}
var lerp_1 = lerp$1;

/*
 * Ben Postlethwaite
 * January 2013
 * License MIT
 */

var colorScale = colorScale$1;
var lerp = lerp_1;

var colormap = createColormap;

function createColormap (spec) {
    /*
     * Default Options
     */
    var indicies, fromrgba, torgba,
        nsteps, cmap, colormap, format,
        nshades, colors, alpha, i;

    if ( !spec ) spec = {};

    nshades = (spec.nshades || 72) - 1;
    format = spec.format || 'hex';

    colormap = spec.colormap;
    if (!colormap) colormap = 'jet';

    if (typeof colormap === 'string') {
        colormap = colormap.toLowerCase();

        if (!colorScale[colormap]) {
            throw Error(colormap + ' not a supported colorscale');
        }

        cmap = colorScale[colormap];

    } else if (Array.isArray(colormap)) {
        cmap = colormap.slice();

    } else {
        throw Error('unsupported colormap option', colormap);
    }

    if (cmap.length > nshades + 1) {
        throw new Error(
            colormap+' map requires nshades to be at least size '+cmap.length
        );
    }

    if (!Array.isArray(spec.alpha)) {

        if (typeof spec.alpha === 'number') {
            alpha = [spec.alpha, spec.alpha];

        } else {
            alpha = [1, 1];
        }

    } else if (spec.alpha.length !== 2) {
        alpha = [1, 1];

    } else {
        alpha = spec.alpha.slice();
    }

    // map index points from 0..1 to 0..n-1
    indicies = cmap.map(function(c) {
        return Math.round(c.index * nshades);
    });

    // Add alpha channel to the map
    alpha[0] = Math.min(Math.max(alpha[0], 0), 1);
    alpha[1] = Math.min(Math.max(alpha[1], 0), 1);

    var steps = cmap.map(function(c, i) {
        var index = cmap[i].index;

        var rgba = cmap[i].rgb.slice();

        // if user supplies their own map use it
        if (rgba.length === 4 && rgba[3] >= 0 && rgba[3] <= 1) {
            return rgba
        }
        rgba[3] = alpha[0] + (alpha[1] - alpha[0])*index;

        return rgba
    });


    /*
     * map increasing linear values between indicies to
     * linear steps in colorvalues
     */
    var colors = [];
    for (i = 0; i < indicies.length-1; ++i) {
        nsteps = indicies[i+1] - indicies[i];
        fromrgba = steps[i];
        torgba = steps[i+1];

        for (var j = 0; j < nsteps; j++) {
            var amt = j / nsteps;
            colors.push([
                Math.round(lerp(fromrgba[0], torgba[0], amt)),
                Math.round(lerp(fromrgba[1], torgba[1], amt)),
                Math.round(lerp(fromrgba[2], torgba[2], amt)),
                lerp(fromrgba[3], torgba[3], amt)
            ]);
        }
    }

    //add 1 step as last value
    colors.push(cmap[cmap.length - 1].rgb.concat(alpha[1]));

    if (format === 'hex') colors = colors.map( rgb2hex );
    else if (format === 'rgbaString') colors = colors.map( rgbaStr );
    else if (format === 'float') colors = colors.map( rgb2float );

    return colors;
}
function rgb2float (rgba) {
    return [
        rgba[0] / 255,
        rgba[1] / 255,
        rgba[2] / 255,
        rgba[3]
    ]
}

function rgb2hex (rgba) {
    var dig, hex = '#';
    for (var i = 0; i < 3; ++i) {
        dig = rgba[i];
        dig = dig.toString(16);
        hex += ('00' + dig).substr( dig.length );
    }
    return hex;
}

function rgbaStr (rgba) {
    return 'rgba(' + rgba.join(',') + ')';
}

/* src/Component.svelte generated by Svelte v3.49.0 */

function add_css(target) {
	append_styles(target, "svelte-6t8cnw", ".spec.svelte-6t8cnw{height:75px;width:150px;margin-left:48px}.label.svelte-6t8cnw{font-size:12px;color:rgba(0, 0, 0, 0.5);font-variant:small-caps}.value.svelte-6t8cnw{font-size:12px}.box.svelte-6t8cnw{padding:10px;margin:10px;border:0.5px solid rgb(224, 224, 224)}#container.svelte-6t8cnw{display:flex;flex-direction:row;flex-wrap:wrap}");
}

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[13] = list[i];
	child_ctx[14] = list;
	child_ctx[15] = i;
	return child_ctx;
}

// (70:10) <Icon component={Svg} viewBox="0 0 24 24">
function create_default_slot_1(ctx) {
	let path;
	let path_d_value;

	return {
		c() {
			path = svg_element("path");
			attr(path, "fill", "currentColor");

			attr(path, "d", path_d_value = /*waves*/ ctx[6][/*i*/ ctx[15]] && /*waves*/ ctx[6][/*i*/ ctx[15]].isPlaying()
			? mdiPause
			: mdiPlay);
		},
		m(target, anchor) {
			insert(target, path, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*waves*/ 64 && path_d_value !== (path_d_value = /*waves*/ ctx[6][/*i*/ ctx[15]] && /*waves*/ ctx[6][/*i*/ ctx[15]].isPlaying()
			? mdiPause
			: mdiPlay)) {
				attr(path, "d", path_d_value);
			}
		},
		d(detaching) {
			if (detaching) detach(path);
		}
	};
}

// (65:8) <IconButton           on:click={() => {             waves[i].isPlaying() ? waves[i].pause() : waves[i].play();           }}         >
function create_default_slot(ctx) {
	let icon;
	let current;

	icon = new Icon({
			props: {
				component: Svg,
				viewBox: "0 0 24 24",
				$$slots: { default: [create_default_slot_1] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(icon.$$.fragment);
		},
		m(target, anchor) {
			mount_component(icon, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const icon_changes = {};

			if (dirty & /*$$scope, waves*/ 65600) {
				icon_changes.$$scope = { dirty, ctx };
			}

			icon.$set(icon_changes);
		},
		i(local) {
			if (current) return;
			transition_in(icon.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(icon.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(icon, detaching);
		}
	};
}

// (88:6) {#if modelColumn && row[modelColumn]}
function create_if_block(ctx) {
	let br;
	let t0;
	let span0;
	let t2;
	let span1;
	let t3_value = /*row*/ ctx[13][/*modelColumn*/ ctx[1]] + "";
	let t3;

	return {
		c() {
			br = element("br");
			t0 = space();
			span0 = element("span");
			span0.textContent = "output:";
			t2 = space();
			span1 = element("span");
			t3 = text(t3_value);
			attr(span0, "class", "label svelte-6t8cnw");
			attr(span1, "class", "value svelte-6t8cnw");
		},
		m(target, anchor) {
			insert(target, br, anchor);
			insert(target, t0, anchor);
			insert(target, span0, anchor);
			insert(target, t2, anchor);
			insert(target, span1, anchor);
			append(span1, t3);
		},
		p(ctx, dirty) {
			if (dirty & /*table, modelColumn*/ 3 && t3_value !== (t3_value = /*row*/ ctx[13][/*modelColumn*/ ctx[1]] + "")) set_data(t3, t3_value);
		},
		d(detaching) {
			if (detaching) detach(br);
			if (detaching) detach(t0);
			if (detaching) detach(span0);
			if (detaching) detach(t2);
			if (detaching) detach(span1);
		}
	};
}

// (62:2) {#each table as row, i}
function create_each_block(ctx) {
	let div3;
	let div1;
	let iconbutton;
	let t0;
	let div0;
	let div0_id_value;
	let i = /*i*/ ctx[15];
	let t1;
	let div2;
	let t2;
	let span0;
	let span1;
	let t4_value = /*row*/ ctx[13][/*labelColumn*/ ctx[2]] + "";
	let t4;
	let t5;
	let t6;
	let current;

	function click_handler() {
		return /*click_handler*/ ctx[9](/*i*/ ctx[15]);
	}

	iconbutton = new IconButton({
			props: {
				$$slots: { default: [create_default_slot] },
				$$scope: { ctx }
			}
		});

	iconbutton.$on("click", click_handler);
	const assign_div0 = () => /*div0_binding*/ ctx[10](div0, i);
	const unassign_div0 = () => /*div0_binding*/ ctx[10](null, i);
	const assign_div2 = () => /*div2_binding*/ ctx[11](div2, i);
	const unassign_div2 = () => /*div2_binding*/ ctx[11](null, i);
	let if_block = /*modelColumn*/ ctx[1] && /*row*/ ctx[13][/*modelColumn*/ ctx[1]] && create_if_block(ctx);

	return {
		c() {
			div3 = element("div");
			div1 = element("div");
			create_component(iconbutton.$$.fragment);
			t0 = space();
			div0 = element("div");
			t1 = space();
			div2 = element("div");
			t2 = space();
			span0 = element("span");
			span0.textContent = "label: ";
			span1 = element("span");
			t4 = text(t4_value);
			t5 = space();
			if (if_block) if_block.c();
			t6 = space();
			attr(div0, "id", div0_id_value = "wave_" + /*row*/ ctx[13][/*idColumn*/ ctx[3]]);
			attr(div0, "class", "svelte-6t8cnw");
			set_style(div0, "width", `150px`, false);
			set_style(div0, "height", `50px`, false);
			set_style(div1, "display", `flex`, false);
			attr(div2, "class", "spec svelte-6t8cnw");
			attr(span0, "class", "label svelte-6t8cnw");
			attr(span1, "class", "value svelte-6t8cnw");
			attr(div3, "class", "box svelte-6t8cnw");
		},
		m(target, anchor) {
			insert(target, div3, anchor);
			append(div3, div1);
			mount_component(iconbutton, div1, null);
			append(div1, t0);
			append(div1, div0);
			assign_div0();
			append(div3, t1);
			append(div3, div2);
			assign_div2();
			append(div3, t2);
			append(div3, span0);
			append(div3, span1);
			append(span1, t4);
			append(div3, t5);
			if (if_block) if_block.m(div3, null);
			append(div3, t6);
			current = true;
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			const iconbutton_changes = {};

			if (dirty & /*$$scope, waves*/ 65600) {
				iconbutton_changes.$$scope = { dirty, ctx };
			}

			iconbutton.$set(iconbutton_changes);

			if (!current || dirty & /*table, idColumn*/ 9 && div0_id_value !== (div0_id_value = "wave_" + /*row*/ ctx[13][/*idColumn*/ ctx[3]])) {
				attr(div0, "id", div0_id_value);
			}

			if (i !== /*i*/ ctx[15]) {
				unassign_div0();
				i = /*i*/ ctx[15];
				assign_div0();
			}

			if (i !== /*i*/ ctx[15]) {
				unassign_div2();
				i = /*i*/ ctx[15];
				assign_div2();
			}

			if ((!current || dirty & /*table, labelColumn*/ 5) && t4_value !== (t4_value = /*row*/ ctx[13][/*labelColumn*/ ctx[2]] + "")) set_data(t4, t4_value);

			if (/*modelColumn*/ ctx[1] && /*row*/ ctx[13][/*modelColumn*/ ctx[1]]) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block(ctx);
					if_block.c();
					if_block.m(div3, t6);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		i(local) {
			if (current) return;
			transition_in(iconbutton.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(iconbutton.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div3);
			destroy_component(iconbutton);
			unassign_div0();
			unassign_div2();
			if (if_block) if_block.d();
		}
	};
}

function create_fragment(ctx) {
	let div;
	let current;
	let each_value = /*table*/ ctx[0];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	return {
		c() {
			div = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(div, "id", "container");
			attr(div, "class", "svelte-6t8cnw");
		},
		m(target, anchor) {
			insert(target, div, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div, null);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			if (dirty & /*table, modelColumn, labelColumn, specDivs, idColumn, divs, waves, Svg, mdiPause, mdiPlay*/ 127) {
				each_value = /*table*/ ctx[0];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(div, null);
					}
				}

				group_outros();

				for (i = each_value.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}
		},
		i(local) {
			if (current) return;

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			destroy_each(each_blocks, detaching);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let waves;
	let { table } = $$props;
	let { modelColumn } = $$props;
	let { labelColumn } = $$props;
	let { dataColumn } = $$props;
	let { transformColumn } = $$props;
	let { idColumn } = $$props;

	const colors = colormap({
		colormap: "density",
		nshades: 256,
		format: "float"
	});

	let divs = [];
	let specDivs = [];

	const click_handler = i => {
		waves[i].isPlaying()
		? waves[i].pause()
		: waves[i].play();
	};

	function div0_binding($$value, i) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			divs[i] = $$value;
			$$invalidate(4, divs);
		});
	}

	function div2_binding($$value, i) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			specDivs[i] = $$value;
			$$invalidate(5, specDivs);
		});
	}

	$$self.$$set = $$props => {
		if ('table' in $$props) $$invalidate(0, table = $$props.table);
		if ('modelColumn' in $$props) $$invalidate(1, modelColumn = $$props.modelColumn);
		if ('labelColumn' in $$props) $$invalidate(2, labelColumn = $$props.labelColumn);
		if ('dataColumn' in $$props) $$invalidate(7, dataColumn = $$props.dataColumn);
		if ('transformColumn' in $$props) $$invalidate(8, transformColumn = $$props.transformColumn);
		if ('idColumn' in $$props) $$invalidate(3, idColumn = $$props.idColumn);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*divs, specDivs, transformColumn, table, idColumn*/ 313) {
			$$invalidate(6, waves = divs.map((d, i) => {
				if (d) {
					d.innerHTML = "";
					let w;

					w = WaveSurfer.create({
						container: d,
						waveColor: "#6a1b9a",
						progressColor: "#6a1b9a",
						mediaControls: true,
						height: 50,
						plugins: [
							SpectrogramPlugin.create({
								container: specDivs[i],
								labels: false,
								height: 50,
								frequencyMax: 4410,
								colorMap: colors
							})
						]
					});

					if (!transformColumn) {
						w.load(`/data/${table[i][idColumn]}`);
					} else {
						w.load(`/cache/${transformColumn}/${table[i][transformColumn]}`);
					}

					return w;
				}
			}));
		}
	};

	return [
		table,
		modelColumn,
		labelColumn,
		idColumn,
		divs,
		specDivs,
		waves,
		dataColumn,
		transformColumn,
		click_handler,
		div0_binding,
		div2_binding
	];
}

class Component extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance,
			create_fragment,
			safe_not_equal,
			{
				table: 0,
				modelColumn: 1,
				labelColumn: 2,
				dataColumn: 7,
				transformColumn: 8,
				idColumn: 3
			},
			add_css
		);
	}
}

function getView(
  table,
  modelColumn,
  labelColumn,
  dataColumn,
  transformColumn,
  idColumn
) {
  let div = document.createElement("div");

  new Component({
    target: div,
    props: {
      table: table,
      modelColumn: modelColumn,
      labelColumn: labelColumn,
      dataColumn: dataColumn,
      transformColumn: transformColumn,
      idColumn: idColumn,
    },
  });
  return div;
}

export { getView as default };
