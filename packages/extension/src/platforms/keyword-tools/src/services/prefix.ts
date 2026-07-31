class PrefixManager {
  private prefix = '';

  init(prefix: string) {
    this.prefix = prefix;
  }

  get(s: string): string {
    return this.prefix ? `${this.prefix}-${s}` : s;
  }

  _(s: string): string {
    return this.get(s);
  }

  id(s: string): string {
    return `#${this.get(s)}`;
  }

  cc(s: string): string {
    return `.${this.get(s)}`;
  }

  data(s: string): string {
    const formatted = s.replace(/-/g, '_');
    return this.prefix ? `${this.prefix}_${formatted}` : formatted;
  }
}

export const Prefix = new PrefixManager();
export default Prefix;
