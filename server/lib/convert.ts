import { basename, dirname, resolve } from 'path';
import { Insightful } from 'types/insightful';
import { countWords } from 'lib/count-words';
import { nodeToAST } from 'lib/node-to-ast';
import * as archiver from 'archiver';
import { Calibre } from 'node-calibre';
import { Extract } from 'unzipper';
import { pandoc } from 'lib/pandoc';
import { JSDOM } from 'jsdom';
import {
  createWriteStream,
  createReadStream,
  ReadStream,
  writeJSON,
  ensureDir,
  writeFile,
  readFile,
  remove,
  mkdir,
  move
} from 'fs-extra';

const calibre = new Calibre({ log: process.enve.NODE_ENV == 'development' });

export async function convert({
  file,
  link,
  text
}: {
  file?: string;
  link?: string;
  text?: string;
}): Promise<ReadStream> {
  // Create directory we'll work in while converting our files
  const workDirectory = resolve(process.enve.TEMP_DIR, `workdir-${Date.now()}`);

  try {
    // Create work directory
    await mkdir(workDirectory);

    // Move uploaded file to work directory
    if (file) {
      const originalFile = file;
      file = resolve(workDirectory, basename(originalFile));
      await move(originalFile, file);
    }

    // Save to .txt file
    else if (text) {
      file = resolve(workDirectory, `${Date.now()}.txt`);
      await writeFile(file, text);
      text = undefined;
    }

    // Create EPUB from webpage
    else if (link) {
      // Set file and directory paths we'll use later
      const webpageDirectory = resolve(workDirectory, `webpage-${Date.now()}`);
      const webpageImgDirectory = resolve(webpageDirectory, 'images');
      const markdownFile = resolve(webpageDirectory, 'index.md');
      const htmlFile = resolve(webpageDirectory, 'index.html');

      // Create webpage directory
      await mkdir(webpageDirectory);

      // Pandoc converts page to CommonMark-raw_html to discard unwanted elements
      await pandoc({
        'extract-media': webpageImgDirectory,
        output: markdownFile,
        input: link,
        from: 'html',
        to: 'commonmark-raw_html'
      });

      // Convert Markdown back to HTML
      await pandoc({
        output: htmlFile,
        input: markdownFile,
        from: 'commonmark',
        to: 'html'
      });

      // Convert to a proper HTML document so next pandoc call doesn't complain
      await writeFile(
        htmlFile,
        `<!DOCTYPE html><html><head><title>.</title></head>${await readFile(
          htmlFile
        )}</html>`
      );

      // Convert HTML to EPUB
      file = resolve(workDirectory, `${Date.now()}.epub`);
      await pandoc({ output: file, input: htmlFile, from: 'html', to: 'epub' });
    }

    if (!file) throw new Error('Bad or missing input');

    // Convert to EPUB
    // Even if already an EPUB, it will validate and rebuild as we expect it
    file = await calibre.ebookConvert(file, 'epub');

    // Extract files from EPUB
    const epubDirectory = resolve(workDirectory, `unzip-${Date.now()}`);
    await new Promise(resolve =>
      createReadStream(file as string).pipe(
        Extract({ path: epubDirectory }).on('close', resolve)
      )
    );

    // Parse OPF with jsdom
    const opfDom = new JSDOM(
      await readFile(resolve(epubDirectory, 'content.opf')),
      { contentType: 'text/xml' }
    );
    const opfDoc = opfDom.window.document;

    // Create directories for unzipped astpub
    const astpubDirectory = resolve(workDirectory, `astpub-${Date.now()}`);
    const astpubImgDirectory = resolve(astpubDirectory, 'images');
    await mkdir(astpubDirectory);
    await mkdir(astpubImgDirectory);

    // Hash map for item id->href
    const idToHref: { [id: string]: string } = {};

    // Relative file path/name for cover image
    const covers: { id1?: string; id2?: string; href?: string } = {};
    let cover: Insightful.Entity['cover'];

    // How many words are in the content
    let words = 0;

    // Loop through package>manifest>item elements
    for (let item of opfDoc.getElementsByTagName('item')) {
      const mediaType = item.getAttribute('media-type');
      const href = item.getAttribute('href');
      const id = item.getAttribute('id');
      if (!mediaType || !href || !id) continue;

      idToHref[id] = href;

      // Move images from EPUB directory to astpub directory
      if (mediaType.startsWith('image/')) {
        await move(
          resolve(epubDirectory, href),
          resolve(astpubImgDirectory, href)
        );

        // Search for href of cover image
        if (!cover) {
          // Guaranteed to be cover image
          const properties = item.getAttribute('properties');
          if (properties == 'cover-image') cover = href;
          // Most likely the cover but a guaranteed option may still be available
          else if (id == 'cover') covers.id1 = href;
          else if (id == 'ci') covers.id2 = href;
          else if (href.startsWith('cover')) covers.href = href;
        }
      }
      // Convert XHTML to our JSON via jsdom
      if (/xhtml|html|xml/.test(mediaType)) {
        // Read file
        const xhtmlDom = new JSDOM(
          await readFile(resolve(epubDirectory, href)),
          { contentType: 'text/xml' }
        );
        const xhtmlDoc = xhtmlDom.window.document;

        // Check for body element since document could be XML (like toc.ncx)
        if (!xhtmlDoc.body) continue;

        // Convert document starting at body to AST
        // Do not include body node itself in AST (only its children)
        const { c: ast } = nodeToAST(xhtmlDoc.body) as Insightful.AST;

        // Count words in AST nodes
        for (let node of ast) words += countWords(node);

        // Write AST to file
        // File might be nested in other directories
        const xhtmlFile = resolve(astpubDirectory, `${href}.json`);
        await ensureDir(dirname(xhtmlFile));
        await writeJSON(xhtmlFile, ast);
      }
    }

    // Use fallbacks for cover image if available
    if (!cover) cover = covers.id1 || covers.id2 || covers.href;

    // Populate entity object which will be used for meta.json
    const entity: Insightful.Entity = {
      authors:
        Array.from(opfDoc.getElementsByTagName('dc:creator'))
          .map(creator => creator.textContent)
          .join(', ') || undefined,
      bookmark: { element: 0, section: 0, width: 0, line: 0 },
      cover: `images/${cover}`,
      id: Date.now(),
      link,
      name: opfDoc.getElementsByTagName('dc:title')[0].textContent || '',
      published: (() => {
        const date = opfDoc.getElementsByTagName('dc:date')[0];
        if (date) return new Date(date.textContent as string).getTime();
      })(),
      publisher: (() => {
        const pub = opfDoc.getElementsByTagName('dc:publisher')[0];
        if (pub) return pub.textContent as string;
      })(),
      // Order content items for spine
      spine: Array.from(opfDoc.getElementsByTagName('itemref')).map(
        ref => idToHref[ref.getAttribute('idref') as string]
      ),
      starred: false,
      tags: [],
      version: process.enve.ASTPUB_VERSION,
      words:
        words > 999999
          ? `${(words / 1000000).toFixed(2)}m`
          : words > 999
          ? `${Math.round(words / 1000)}k`
          : words.toString()
    };

    // Write meta.json
    await writeJSON(resolve(astpubDirectory, 'meta.json'), entity);

    // Zip directory
    const astpubFile = resolve(workDirectory, `astpub-${Date.now()}.zip`);
    const astpubWriter = createWriteStream(astpubFile);
    const astpubArchive = archiver('zip');
    const astpubPromise = new Promise(r => astpubWriter.on('close', r));
    astpubArchive.pipe(astpubWriter);
    astpubArchive.directory(astpubDirectory, false);
    astpubArchive.finalize();
    await astpubPromise;

    // Create stream to return for astpub file
    const astpubReader = createReadStream(astpubFile);

    // Delete work directory after final file has been consumed
    astpubReader.on('close', () => remove(workDirectory, () => undefined));

    // Return string to astpub file
    return astpubReader;
  } catch (err) {
    // Get rid of all our temp files
    await remove(workDirectory);

    throw err;
  }
}
