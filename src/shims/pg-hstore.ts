export default function pgHstoreStub() {
  return {
    parse() {
      throw new Error('pg-hstore is not available in this environment');
    },
    stringify() {
      throw new Error('pg-hstore is not available in this environment');
    }
  } as any;
}
