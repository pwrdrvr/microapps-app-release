declare module 'next/dist/compiled/picomatch/index.js' {
  type Matcher = (input: string) => boolean;

  function picomatch(
    glob: string | readonly string[],
    options?: { contains?: boolean; dot?: boolean },
  ): Matcher;

  export default picomatch;
}
