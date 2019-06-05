// Type definitions for wtf_wikipedia 7.3
// Project: https://github.com/spencermountain/wtf_wikipedia#readme
// Definitions by: Rob Rose <https://github.com/RobRoseKnows>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

declare module 'wtf_wikipedia' {
  export const version: string;

  export function category(
    cat: string,
    lang: string,
    options: object,
    cb: any
  ): Promise<object>;

  export function fetch(
    title: string,
    lang?: string,
    options?: any,
    cb?: any
  ): Promise<null | Document>;

  export function fetch(
    titles: string[],
    lang?: string,
    options?: any,
    cb?: any
  ): Promise<Document[]>;

  export function random(
    lang: string,
    options: object,
    cb: any
  ): Promise<Document>;

  class Document {
    private data: object;

    private options: object;

    title(str: string | undefined): string;

    isRedirect(): boolean;

    redirectTo(): Document;

    // Alias of redirectTo
    redirectsTo(): Document;

    // Alias of redirectTo
    redirect(): Document;

    // Alias of redirectTo
    redirects(): Document;

    isDisambiguation(): boolean;

    // Alias of isDisambiguation
    isDisambig(): boolean;

    categories(clue: number): string;

    // Singular
    category(clue: number): string;

    categories(): string[];

    sections(clue: number | string): Section;

    // Generated by plurals
    section(clue: number | string): Section;

    sections(): Section[];

    paragraphs(n: number): Paragraph;

    paragraphs(): Paragraph[];

    paragraph(n: number | undefined): Paragraph;

    sentences(n: number): Sentence;

    // Generated by plurals
    sentence(n: number): Sentence;

    sentences(): Sentence[];

    images(clue: number): Image;

    // Singular
    image(clue: number): Image;

    images(): Image[];

    links(clue: string | undefined | null): object[];

    links(clue: number): object;

    // Singular
    link(clue: number): object;

    interwiki(clue: string | undefined | null): object[];

    interwiki(clue: number): object;

    lists(clue: string | undefined | null): List[];

    lists(clue: number): List;

    tables(clue: string | undefined | null): Table[];

    tables(clue: number): Table;

    // Singular
    table(clue: number): Table;

    templates(clue: string | undefined | null): object[];

    templates(clue: number): object;

    references(clue: string | undefined | null): Reference[];

    references(clue: number): Reference;

    // Singular
    reference(clue: number): Reference;

    // Alias of references
    citations(clue: string | undefined | null): Reference[];

    // Alias of references
    citations(clue: number): Reference;

    // Alias and singular
    citation(clue: number): Reference;

    coordinates(clue: string | undefined | null): object[];

    coordinates(clue: number): object;

    // Singular
    coordinate(clue: number): object;

    infoboxes(clue: number): Infobox;

    // generated by plurals
    infobox(clue: number): Infobox;

    infoboxes(): Infobox[];

    text(options: object | null | undefined): string;

    markdown(options: object | null | undefined): string;

    latex(options: object | null | undefined): string;

    html(options: object | null | undefined): string;

    json(options: object | null | undefined): object;

    debug(): Document;
  }

  class Section {
    private depth: number;
    private doc: Document;
    private _title: string;
    private data: object;

    title(): string;

    index(): null | number;

    indentation(): number;

    sentences(n: number): Sentence;

    sentences(): Sentence[];

    paragraphs(n: number): Paragraph;

    paragraphs(): Paragraph[];

    paragraph(n: number | undefined | null): Paragraph;

    links(n: number): object;

    links(n: string | undefined | null): object[];

    tables(n: number): Table;

    tables(): Table[];

    templates(clue: number): object;

    templates(clue: string | undefined | null): object[];

    infoboxes(clue: number): Infobox;

    infoboxes(): Infobox[];

    coordinates(clue: number): object;

    coordinates(): object[];

    lists(clue: number): List;

    lists(): List[];

    interwiki(num: number): object;

    interwiki(): object[];

    images(clue: number): Image;

    images(): Image[];

    references(clue: number): Reference;

    references(): Reference[];

    // Alias of references()
    citations(clue: number): Reference;

    // Alias of references()
    citations(): Reference[];

    remove(): Document;

    nextSibling(): Section | null;

    // Alias of nextSibling()
    next(): Section | null;

    lastSibling(): Section | null;

    // Alias of lastSibling()
    last(): Section | null;

    // Alias of lastSibling()
    previousSibling(): Section | null;

    // Alias of lastSibling()
    previous(): Section | null;

    children(n: string | undefined | null): Section[];

    children(n: number): Section;

    // Alias of children
    sections(n: string | undefined | null): Section[];

    // Alias of children
    sections(n: number): Section;

    parent(): null | Section;

    text(options: object | null | undefined): string;

    markdown(options: object | null | undefined): string;

    latex(options: object | null | undefined): string;

    html(options: object | null | undefined): string;

    json(options: object | null | undefined): object;
  }

  class Infobox {
    private _type: string;

    type(): string;

    // Alias of type()
    template(): string;

    links(n: number): object;

    links(n: string | undefined | null): object[];

    image(): Image | null;

    // Alias of image()
    images(): Image | null;

    get(key: string): object | null;

    keyValue(): object;

    // Alias of keyValue()
    data(): object;

    text(): string;

    markdown(options: object | null | undefined): string;

    latex(options: object | null | undefined): string;

    html(options: object | null | undefined): string;

    json(options: object | null | undefined): object;
  }

  class Table {
    private data: object;

    links(n: number): object;

    links(n: string | undefined | null): object[];

    keyValue(options: object): object;

    // Alias of keyValue
    keyvalue(options: object): object;

    // Alais of keyValue
    keyval(options: object): object;

    text(): string;

    markdown(options: object | null | undefined): string;

    latex(options: object | null | undefined): string;

    html(options: object | null | undefined): string;

    json(options: object | null | undefined): object;
  }

  class Reference {
    private data: object;

    title(): string;

    links(n: number): object;

    links(n: string | undefined | null): object[];

    text(): string;

    markdown(options: object | null | undefined): string;

    latex(options: object | null | undefined): string;

    html(options: object | null | undefined): string;

    json(options: object | null | undefined): object;
  }

  class Paragraph {
    private data: object;

    sentences(num: number): Sentence;

    sentences(): Sentence[];

    references(num: number): Reference;

    references(): Reference[];

    // Alias of references
    citations(num: number): Reference;

    // Alias of references
    citations(): Reference[];

    lists(num: number): List;

    lists(): List[];

    images(num: number): Image;

    images(): Image[];

    links(n: number): object;

    links(n: string | undefined | null): object;

    interwiki(num: number): object;

    interwiki(): object[];

    text(options: object | null | undefined): string;

    markdown(options: object | null | undefined): string;

    latex(options: object | null | undefined): string;

    html(options: object | null | undefined): string;

    json(options: object | null | undefined): object;
  }

  class Image {
    private data: object;

    file(): string;

    alt(): string;

    caption(): string;

    links(): object[];

    url(): string;

    // Alias of url()
    src(): string;

    thumbnail(size: number): string;

    // Alias of thumbnail()
    thumb(size: number): string;

    format(): string;

    exists(callback: () => boolean): Promise<boolean>;

    text(): string;

    markdown(options: object | null | undefined): string;

    latex(options: object | null | undefined): string;

    html(options: object | null | undefined): string;

    json(options: object | null | undefined): object;
  }

  class List {
    private data: object;

    lines(): object;

    links(n: number): object;

    links(n: string | undefined | null): object;

    interwiki(num: number): object;

    interwiki(): object[];

    text(options: object | null | undefined): string;

    markdown(options: object | null | undefined): string;

    latex(options: object | null | undefined): string;

    html(options: object | null | undefined): string;

    json(options: object | null | undefined): object;
  }

  class Sentence {
    private data: object;

    links(n: number): object;

    links(n: string | undefined | null): object;

    interwiki(num: number): object;

    interwiki(): object[];

    bolds(n: number): string;

    bolds(): string[];

    // Alias of bolds
    bold(n: number): string;

    // Alias of bolds
    bold(): string[];

    italics(n: number): string;

    italics(): string[];

    // Alias of italics
    italic(n: number): string;

    // Alias of italics
    italic(): string[];

    dates(n: number): string;

    dates(): string[];

    text(str: string | null | undefined): string;

    // Alias of text
    plaintext(str: string | null | undefined): string;

    markdown(options: object | null | undefined): string;

    latex(options: object | null | undefined): string;

    html(options: object | null | undefined): string;

    json(options: object | null | undefined): object;
  }
}
