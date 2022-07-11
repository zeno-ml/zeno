function noop() { }
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
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);
}
function children(element) {
    return Array.from(element.childNodes);
}
function set_data(text, data) {
    data = '' + data;
    if (text.wholeText !== data)
        text.data = data;
}

let current_component;
function set_current_component(component) {
    current_component = component;
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
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
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

/* src/Component.svelte generated by Svelte v3.49.0 */

function add_css(target) {
	append_styles(target, "svelte-2kxeq5", "#container.svelte-2kxeq5{display:flex;flex-direction:row;flex-wrap:wrap}.label.svelte-2kxeq5{font-size:10px;color:rgba(0, 0, 0, 0.5);font-variant:small-caps}.value.svelte-2kxeq5{font-size:10px}.box.svelte-2kxeq5{padding:10px;margin:10px;border:0.5px solid rgb(224, 224, 224)}");
}

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[6] = list[i];
	return child_ctx;
}

// (24:6) {#if modelColumn && row[modelColumn]}
function create_if_block(ctx) {
	let br;
	let t0;
	let span0;
	let t2;
	let span1;
	let t3_value = /*row*/ ctx[6][/*modelColumn*/ ctx[1]] + "";
	let t3;

	return {
		c() {
			br = element("br");
			t0 = space();
			span0 = element("span");
			span0.textContent = "pred:";
			t2 = space();
			span1 = element("span");
			t3 = text(t3_value);
			attr(span0, "class", "label svelte-2kxeq5");
			attr(span1, "class", "value svelte-2kxeq5");
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
			if (dirty & /*table, modelColumn*/ 3 && t3_value !== (t3_value = /*row*/ ctx[6][/*modelColumn*/ ctx[1]] + "")) set_data(t3, t3_value);
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

// (17:2) {#each table as row}
function create_each_block(ctx) {
	let div;
	let span0;
	let t0_value = /*row*/ ctx[6][/*dataColumn*/ ctx[3]] + "";
	let t0;
	let t1;
	let br;
	let t2;
	let span1;
	let span2;
	let t4_value = /*row*/ ctx[6][/*labelColumn*/ ctx[2]] + "";
	let t4;
	let t5;
	let t6;
	let if_block = /*modelColumn*/ ctx[1] && /*row*/ ctx[6][/*modelColumn*/ ctx[1]] && create_if_block(ctx);

	return {
		c() {
			div = element("div");
			span0 = element("span");
			t0 = text(t0_value);
			t1 = space();
			br = element("br");
			t2 = space();
			span1 = element("span");
			span1.textContent = "label: ";
			span2 = element("span");
			t4 = text(t4_value);
			t5 = space();
			if (if_block) if_block.c();
			t6 = space();
			attr(span1, "class", "label svelte-2kxeq5");
			attr(span2, "class", "value svelte-2kxeq5");
			attr(div, "class", "box svelte-2kxeq5");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, span0);
			append(span0, t0);
			append(div, t1);
			append(div, br);
			append(div, t2);
			append(div, span1);
			append(div, span2);
			append(span2, t4);
			append(div, t5);
			if (if_block) if_block.m(div, null);
			append(div, t6);
		},
		p(ctx, dirty) {
			if (dirty & /*table, dataColumn*/ 9 && t0_value !== (t0_value = /*row*/ ctx[6][/*dataColumn*/ ctx[3]] + "")) set_data(t0, t0_value);
			if (dirty & /*table, labelColumn*/ 5 && t4_value !== (t4_value = /*row*/ ctx[6][/*labelColumn*/ ctx[2]] + "")) set_data(t4, t4_value);

			if (/*modelColumn*/ ctx[1] && /*row*/ ctx[6][/*modelColumn*/ ctx[1]]) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block(ctx);
					if_block.c();
					if_block.m(div, t6);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		d(detaching) {
			if (detaching) detach(div);
			if (if_block) if_block.d();
		}
	};
}

function create_fragment(ctx) {
	let div;
	let each_value = /*table*/ ctx[0];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	return {
		c() {
			div = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(div, "id", "container");
			attr(div, "class", "svelte-2kxeq5");
		},
		m(target, anchor) {
			insert(target, div, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div, null);
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*table, modelColumn, labelColumn, dataColumn*/ 15) {
				each_value = /*table*/ ctx[0];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(div, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div);
			destroy_each(each_blocks, detaching);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let { table } = $$props;
	let { modelColumn } = $$props;
	let { labelColumn } = $$props;
	let { dataColumn } = $$props;
	let { transformColumn } = $$props;
	let { idColumn } = $$props;

	$$self.$$set = $$props => {
		if ('table' in $$props) $$invalidate(0, table = $$props.table);
		if ('modelColumn' in $$props) $$invalidate(1, modelColumn = $$props.modelColumn);
		if ('labelColumn' in $$props) $$invalidate(2, labelColumn = $$props.labelColumn);
		if ('dataColumn' in $$props) $$invalidate(3, dataColumn = $$props.dataColumn);
		if ('transformColumn' in $$props) $$invalidate(4, transformColumn = $$props.transformColumn);
		if ('idColumn' in $$props) $$invalidate(5, idColumn = $$props.idColumn);
	};

	return [table, modelColumn, labelColumn, dataColumn, transformColumn, idColumn];
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
				dataColumn: 3,
				transformColumn: 4,
				idColumn: 5
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
