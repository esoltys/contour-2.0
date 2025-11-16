/**
 * DOM Utilities - Type-safe DOM element creation helpers
 *
 * Provides a fluent API for creating DOM elements with reduced boilerplate.
 * These utilities are used throughout the playground UI components.
 */

/**
 * Options for creating an HTML element.
 */
export interface ElementOptions {
  /** CSS class name(s) - can be a single string or array of strings */
  className?: string | string[];
  /** Element ID */
  id?: string;
  /** Text content for the element */
  text?: string;
  /** HTML content (use with caution) */
  html?: string;
  /** Inline styles */
  style?: Partial<CSSStyleDeclaration>;
  /** Data attributes (without 'data-' prefix) */
  data?: Record<string, string>;
  /** Other attributes */
  attrs?: Record<string, string>;
  /** Event listeners */
  events?: Record<string, EventListener>;
  /** Child elements to append */
  children?: (HTMLElement | string)[];
}

/**
 * Create an HTML element with the given options.
 *
 * @param tag - HTML tag name
 * @param options - Element configuration options
 * @returns The created HTML element
 *
 * @example
 * ```typescript
 * const button = createElement('button', {
 *   className: 'btn btn-primary',
 *   text: 'Click Me',
 *   events: { click: () => console.log('clicked') }
 * });
 * ```
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: ElementOptions = {}
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);

  // Set class name(s)
  if (options.className) {
    if (Array.isArray(options.className)) {
      element.className = options.className.join(' ');
    } else {
      element.className = options.className;
    }
  }

  // Set ID
  if (options.id) {
    element.id = options.id;
  }

  // Set text content
  if (options.text !== undefined) {
    element.textContent = options.text;
  }

  // Set HTML content
  if (options.html !== undefined) {
    element.innerHTML = options.html;
  }

  // Set inline styles
  if (options.style) {
    Object.assign(element.style, options.style);
  }

  // Set data attributes
  if (options.data) {
    for (const [key, value] of Object.entries(options.data)) {
      element.dataset[key] = value;
    }
  }

  // Set other attributes
  if (options.attrs) {
    for (const [key, value] of Object.entries(options.attrs)) {
      element.setAttribute(key, value);
    }
  }

  // Add event listeners
  if (options.events) {
    for (const [event, handler] of Object.entries(options.events)) {
      element.addEventListener(event, handler);
    }
  }

  // Append children
  if (options.children) {
    for (const child of options.children) {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    }
  }

  return element;
}

/**
 * Create a div element.
 *
 * @example
 * ```typescript
 * const container = div({ className: 'container', id: 'main' });
 * ```
 */
export function div(options: ElementOptions = {}): HTMLDivElement {
  return createElement('div', options);
}

/**
 * Create a span element.
 *
 * @example
 * ```typescript
 * const label = span({ className: 'label', text: 'Status:' });
 * ```
 */
export function span(options: ElementOptions = {}): HTMLSpanElement {
  return createElement('span', options);
}

/**
 * Create a button element.
 *
 * @example
 * ```typescript
 * const btn = button({
 *   className: 'btn-primary',
 *   text: 'Submit',
 *   events: { click: handleClick }
 * });
 * ```
 */
export function button(options: ElementOptions = {}): HTMLButtonElement {
  return createElement('button', options);
}

/**
 * Create an input element.
 *
 * @example
 * ```typescript
 * const input = inputEl({
 *   className: 'search-input',
 *   attrs: { type: 'text', placeholder: 'Search...' }
 * });
 * ```
 */
export function inputEl(options: ElementOptions = {}): HTMLInputElement {
  return createElement('input', options);
}

/**
 * Create a select element.
 *
 * @example
 * ```typescript
 * const select = selectEl({
 *   className: 'filter-select',
 *   id: 'category-filter'
 * });
 * ```
 */
export function selectEl(options: ElementOptions = {}): HTMLSelectElement {
  return createElement('select', options);
}

/**
 * Create an option element.
 *
 * @example
 * ```typescript
 * const option = optionEl({
 *   text: 'All Categories',
 *   attrs: { value: 'all' }
 * });
 * ```
 */
export function optionEl(options: ElementOptions = {}): HTMLOptionElement {
  return createElement('option', options);
}

/**
 * Create a label element.
 *
 * @example
 * ```typescript
 * const label = labelEl({
 *   className: 'form-label',
 *   attrs: { for: 'input-id' },
 *   text: 'Username:'
 * });
 * ```
 */
export function labelEl(options: ElementOptions = {}): HTMLLabelElement {
  return createElement('label', options);
}

/**
 * Create an h2 element.
 *
 * @example
 * ```typescript
 * const heading = h2({ text: 'Section Title' });
 * ```
 */
export function h2(options: ElementOptions = {}): HTMLHeadingElement {
  return createElement('h2', options);
}
