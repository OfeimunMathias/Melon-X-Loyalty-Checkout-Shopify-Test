declare namespace JSX {
    interface IntrinsicElements {
      's-page': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        heading?: string;
      };

      's-section': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;

      's-paragraph': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;

      's-button': React.DetailedHTMLProps<
        React.ButtonHTMLAttributes<HTMLButtonElement>,
        HTMLButtonElement
      > & {
        type?: 'button' | 'submit' | 'reset';
      };

      's-text-field': React.DetailedHTMLProps<
        React.InputHTMLAttributes<HTMLInputElement>,
        HTMLInputElement
      > & {
        label?: string;
        placeholder?: string;
        name?: string;
        defaultValue?: string;
        type?: string;
      };
    }
  }
