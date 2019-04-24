export namespace Insightful {
  export interface Tag {
    id: number;
    name: string;
  }

  export interface Entity {
    id: number;
    name: string;
    tags: Tag['id'][];
    link: string | undefined;
    /**
     * Name of the cover file within the zip's `resources` directory.
     */
    cover: string | undefined;
    /**
     * How many words the entity contains.
     * @example "920" | "20k" | "1.25m"
     */
    words: string;
    starred: boolean;
    authors: string | undefined;
    bookmark: {
      /**
       * Index of section.
       */
      section: number;
      /**
       * Index of element in section. Used as fallback for `line`.
       */
      element: number;
      /**
       * Screen width at last bookmark update.
       */
      width: number;
      /**
       * Index of line in section. Discarded if `width` has changed.
       */
      line: number;
    };
    published: number | undefined;
    publisher: string | undefined;
  }

  export namespace Env {
    export interface Common {
      /**
       * Node environment.
       */
      NODE_ENV: 'development' | 'production';
    }

    export interface Server extends Insightful.Env.Common {
      /**
       * The port to host the API server on.
       * @example 2700
       */
      API_PORT: number;
      /**
       * The app's root web client URL.
       * @example "https://example.com"
       */
      WEB_URL: string;
      /**
       * Absolute path for insightful-web.
       * @example "/path/to/insightful/web"
       */
      WEB_DIRECTORY: string;
    }

    export interface Web extends Insightful.Env.Common {
      /**
       * Port for the Webpack dev server. Only needed for developers.
       * @example 2701
       */
      DEV_SERVER_PORT: number;
    }
  }
}
