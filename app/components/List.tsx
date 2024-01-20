export const List = <T,>(props: {
  list: readonly T[];
  children: (item: T, index: number) => React.ReactNode;
  fallback: () => React.ReactNode;
}) =>
  props.list.length > 0 ? props.list.map(props.children) : props.fallback();
