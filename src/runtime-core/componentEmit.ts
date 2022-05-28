export function emit(instance, event, ...args) {
  console.log('emit', event);
  const { props } = instance;

  const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const camelize = (str: string) => {
    return str.replace(/-(\w)/g, (_, s: string) => {
      return s ? s.toUpperCase() : '';
    });
  };

  const toHandlerKey = (str: string) => {
    return str ? 'on' + capitalize(camelize(str)) : '';
  };

  const handlerKey = toHandlerKey(event);
  const handler = props[handlerKey];
  handler && handler(...args);
}
