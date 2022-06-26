export function shouldUpdateComponent(prevVNode, nextVNode) {
  const { props: prevProps } = prevVNode;
  const { props: nextProps } = nextVNode;

  for (const key in nextVNode) {
    if (prevProps[key] !== nextProps[key]) {
      return true;
    }
  }

  return false;
}
