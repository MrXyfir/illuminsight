import 'app-module-path/register';
import { config } from 'dotenv';
config();
import 'enve';

import { Insightful } from 'types/insightful';
import { countWords } from 'lib/count-words';
import { nodeToAst } from 'lib/node-to-ast';
import { convert } from 'lib/convert';
import { Extract } from 'unzipper';
import { resolve } from 'path';
import { pandoc } from 'lib/pandoc';
import { JSDOM } from 'jsdom';
import {
  constants as FS,
  ensureDir,
  emptyDir,
  readJSON,
  readFile,
  access,
  copy
} from 'fs-extra';
import 'jest-extended';

// Extract environment variables
const { SERVER_DIRECTORY, TEMP_DIR } = process.enve;

// Set paths used in tests
const convertDirectory = resolve(TEMP_DIR, 'convert-test');
const astpubDirectory = resolve(convertDirectory, 'astpub');
const astpubMetaFile = resolve(astpubDirectory, 'meta.json');
const loremHtmlFile = resolve(SERVER_DIRECTORY, 'res/lorem.html');
const loremAstFile = resolve(SERVER_DIRECTORY, 'res/lorem.ast.json');
const loremMdFile = resolve(convertDirectory, 'lorem.md');

// Ensure test directory exists and is empty
beforeEach(async () => {
  await ensureDir(convertDirectory);
  await emptyDir(convertDirectory);
});

test('nodeToAst()', async () => {
  // Parse HTML into DOM
  const dom = new JSDOM(await readFile(loremHtmlFile));

  // Convert document starting at body to AST
  const { c: ast } = nodeToAst(dom.window.document.body) as Insightful.AST;

  // Uncomment to update AST snapshot
  // await writeFile(astFile, JSON.stringify(ast, null, 2));

  // Validate that AST output has not changed from last snapshot
  const snapshot: Array<Insightful.AST | string> = await readJSON(loremAstFile);
  expect(ast).toMatchObject(snapshot);
});

test('countWords()', async () => {
  // Load AST snapshot
  const ast: Array<Insightful.AST | string> = await readJSON(loremAstFile);

  // Count words in AST nodes
  let words = 0;
  for (let node of ast) words += countWords(node);

  // Validate that words counted has not changed since last snapshot
  expect(words).toBe(449);
});

test('pandoc()', async () => {
  // Convert HTML to CommonMark
  await pandoc({
    output: loremMdFile,
    input: loremHtmlFile,
    from: 'html',
    to: 'commonmark-raw_html'
  });

  // Read Markdown content
  const markdown = await readFile(loremMdFile, 'utf8');

  // Validate content was converted properly
  expect(markdown).toMatch(/^# Lorem Ipsum/m);
  expect(markdown).toMatch(/^#### "Neque porro/m);
  expect(markdown).toMatch(/^Lorem ipsum dolor/m);
});

test('convert({text})', async () => {
  // Convert content to astpub format then extract
  const readStream = await convert({ text: 'Hello World' });
  await new Promise(resolve =>
    readStream.pipe(Extract({ path: astpubDirectory }).on('close', resolve))
  );

  // Validate meta.json
  const entity: Insightful.Entity = await readJSON(astpubMetaFile);
  const _entity: Insightful.Entity = {
    authors: 'Unknown',
    bookmark: { element: 0, line: 0, section: 0, width: 0 },
    cover: 'images/cover_image.jpg',
    id: entity.id,
    name: entity.name,
    spine: ['titlepage.xhtml', 'index-1.html'],
    starred: false,
    tags: [],
    version: 1,
    words: '2'
  };
  expect(entity).toMatchObject(_entity);

  // Validate cover
  await access(resolve(astpubDirectory, 'images/cover_image.jpg'), FS.F_OK);

  // Validate AST
  const ast: Array<Insightful.AST | string> = await readJSON(
    resolve(astpubDirectory, 'index-1.html.json')
  );
  const _ast: Array<Insightful.AST | string> = [
    '\n',
    { c: ['Hello World'], n: 'p' },
    '\n'
  ];
  expect(ast).toMatchObject(_ast);
});

test(
  'convert({link})',
  async () => {
    // Convert content to astpub format then extract
    const readStream = await convert({
      link:
        'https://www.nytimes.com/2019/05/01/magazine/ehren-tool-war-cups-smithsonian.html'
    });
    await new Promise(resolve =>
      readStream.pipe(Extract({ path: astpubDirectory }).on('close', resolve))
    );

    // Validate meta.json
    const entity: Insightful.Entity = await readJSON(astpubMetaFile);
    const _entity: Insightful.Entity = {
      ...entity,
      authors: 'Unknown',
      bookmark: { element: 0, line: 0, section: 0, width: 0 },
      cover: 'images/cover_image.jpg',
      link:
        'https://www.nytimes.com/2019/05/01/magazine/ehren-tool-war-cups-smithsonian.html',
      name: '.',
      spine: [
        'titlepage.xhtml',
        'EPUB/text/title_page.xhtml',
        'EPUB/text/ch001.xhtml',
        'EPUB/text/ch002.xhtml'
      ],
      starred: false,
      tags: [],
      version: 1,
      words: '3k'
    };
    expect(entity).toMatchObject(_entity);

    // Validate cover
    await access(resolve(astpubDirectory, 'images/cover_image.jpg'), FS.F_OK);

    // Validate AST
    const ast: Array<Insightful.AST | string> = await readJSON(
      resolve(astpubDirectory, 'EPUB/text/ch002.xhtml.json')
    );
    const node: Insightful.AST = {
      n: 'h1',
      c: [
        'The Price of This Artist’s Work? A Conversation About the Horrors of War'
      ]
    };
    expect((ast[1] as Insightful.AST).c[1]).toMatchObject(node);
  },
  30 * 1000
);
