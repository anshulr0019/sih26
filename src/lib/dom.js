export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

export function viewHeader(title, subtitle, aside) {
  const header = el('div', 'view__header');
  const block = el('div');
  block.append(el('h1', 'view__title', title));
  if (subtitle) block.append(el('div', 'view__subtitle', subtitle));
  header.append(block);
  if (aside) header.append(aside);
  return header;
}
