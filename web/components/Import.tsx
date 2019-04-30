import * as localForage from 'localforage';
import { useSnackbar } from 'notistack';
import { Insightful } from 'types/insightful';
import { getYear } from 'date-fns';
import * as JSZip from 'jszip';
import * as React from 'react';
import { api } from 'lib/api';
import {
  InputAdornment,
  ListItemText,
  createStyles,
  IconButton,
  Typography,
  WithStyles,
  withStyles,
  TextField,
  ListItem,
  Button,
  Theme,
  List
} from '@material-ui/core';
import {
  InsertDriveFile as FileIcon,
  RemoveCircle as RemoveIcon,
  TextFields as TextIcon,
  Link as LinkIcon,
  Add as AddIcon
} from '@material-ui/icons';

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing.unit * 3
    },
    fileInput: {
      display: 'none'
    },
    fieldset: {
      marginBottom: '1.5em',
      padding: '0',
      border: 'none',
      margin: '0'
    }
  });

function _Import({ classes }: WithStyles<typeof styles>) {
  const { enqueueSnackbar } = useSnackbar();
  const [files, setFiles] = React.useState<File[]>([]);
  const [link, setLink] = React.useState('');
  const [text, setText] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  async function onImportFiles() {
    setBusy(true);
    for (let file of files) {
      await onImportFile(file);
    }
    setBusy(false);
  }

  async function onImportFile(file: File) {
    const data = new FormData();
    data.append('file', file);

    api
      .post('/convert', data)
      .then(res => {
        saveFile(res.data);
        setFiles(files.filter(_f => _f.name != file.name));
      })
      .catch(err => {
        enqueueSnackbar(err.response.data.error);
      });
  }

  async function onImportLink() {
    setBusy(true);
    await api
      .post('/convert', { link })
      .then(res => {
        saveFile(res.data);
        setLink('');
      })
      .catch(err => enqueueSnackbar(err.response.data.error));
    setBusy(false);
  }

  async function onImportText() {
    setBusy(true);
    await api
      .post('/convert', { text })
      .then(res => {
        saveFile(res.data);
        setText('');
      })
      .catch(err => enqueueSnackbar(err.response.data.error));
    setBusy(false);
  }

  async function saveFile(file: Blob) {
    // Parse zip file
    const zip = new JSZip(file);

    // Extract meta.json
    const entity: Insightful.Entity = JSON.parse(
      await zip.file('meta.json').async('text')
    );

    // Ensure we can handle the returned file
    if (entity.version != process.enve.ASTPUB_VERSION)
      return enqueueSnackbar('Client/server ASTPub version mismatch');

    // Extract cover if available and save copy outside of zip
    if (entity.cover) {
      await localForage.setItem(
        `entity-cover-${entity.id}`,
        await zip.file(entity.cover).async('blob')
      );
    }

    // Get indexes from local storage which we'll use and update
    const entities: Insightful.Entity[] =
      (await localForage.getItem('entity-list')) || [];
    const tags: Insightful.Tag[] =
      (await localForage.getItem('tag-list')) || [];

    // Automatically infer tags from meta.json
    let inferredTags: string[] = [];

    // Create tags from authors
    if (entity.authors) {
      // Use entire author string as a tag
      inferredTags.push(entity.authors);

      // Use individual authors as tags
      const authors = entity.authors.split(' & ');
      if (authors.length > 1) inferredTags = inferredTags.concat(authors);
    }

    // Create tag from publisher
    if (entity.publisher) inferredTags.push(entity.publisher);

    // Create tag from published date (year)
    if (entity.published)
      inferredTags.push(getYear(entity.published).toString());

    // Create tag from link (domain)
    if (entity.link) {
      const a = document.createElement('a');
      a.href = entity.link;
      inferredTags.push(a.hostname);
    }

    // Force lowercase for all tags
    inferredTags = inferredTags.map(t => t.toLocaleLowerCase());

    // Convert inferredTags to actual tags in tag-list
    // Link tags to entity and insert into meta.json
    for (let inferredTag of inferredTags) {
      // Check if this tag already exists
      const tag = tags.find(t => t.name == inferredTag);

      // Link to existing tag
      if (tag) {
        entity.tags.push(tag.id);
      }
      // Create and link new tag
      else {
        const tag: Insightful.Tag = { name: inferredTag, id: Date.now() };
        entity.tags.push(tag.id);
        tags.push(tag);
      }
    }

    // Add to and update local storage
    entities.push(entity);
    await localForage.setItem(`entity-${entity.id}`, file);
    await localForage.setItem('tag-list', tags);
    await localForage.setItem('entity-list', entities);
  }

  return (
    <form onSubmit={e => e.preventDefault()} className={classes.root}>
      {busy ? (
        <Typography>Importing content. This may take a while...</Typography>
      ) : null}

      <fieldset className={classes.fieldset}>
        <input
          id="file-input"
          type="file"
          multiple
          onChange={e =>
            setFiles(
              files.concat(
                [...(e.target.files as FileList)].filter(
                  f => files.findIndex(_f => f.name == _f.name) == -1
                )
              )
            )
          }
          className={classes.fileInput}
        />
        <label htmlFor="file-input">
          <Button variant="text" component="span" color="secondary">
            <FileIcon />
            Upload File
          </Button>
        </label>

        {files.length ? (
          <List dense>
            {files.map(f => (
              <ListItem key={f.name}>
                <IconButton
                  aria-label="Remove"
                  onClick={() =>
                    setFiles(files.filter(_f => _f.name != f.name))
                  }
                >
                  <RemoveIcon />
                </IconButton>
                <ListItemText primary={f.name} secondary={`${f.size} bytes`} />
              </ListItem>
            ))}
          </List>
        ) : null}

        <Button
          disabled={!files.length || busy}
          onClick={onImportFiles}
          variant="text"
          color="primary"
        >
          <AddIcon />
          Import from Files
        </Button>
      </fieldset>

      <fieldset className={classes.fieldset}>
        <TextField
          id="link"
          label="Link"
          value={link}
          margin="normal"
          variant="outlined"
          onChange={e => setLink(e.target.value)}
          fullWidth
          onKeyDown={e => (e.key == 'Enter' ? onImportLink() : null)}
          helperText="Import article content from a web page"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LinkIcon />
              </InputAdornment>
            )
          }}
          placeholder="https://example.com/article-123"
        />
        <Button
          disabled={!link || busy}
          onClick={onImportLink}
          variant="text"
          color="primary"
        >
          <AddIcon />
          Import from Link
        </Button>
      </fieldset>

      <fieldset className={classes.fieldset}>
        <TextField
          id="text"
          label="Text"
          value={text}
          margin="normal"
          rowsMax={5}
          variant="outlined"
          onChange={e => setText(e.target.value)}
          fullWidth
          multiline
          onKeyDown={e => (e.key == 'Enter' ? onImportText() : null)}
          helperText="Paste text content"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <TextIcon />
              </InputAdornment>
            )
          }}
          placeholder="Paste content here..."
        />
        <Button
          disabled={!text || busy}
          onClick={onImportText}
          variant="text"
          color="primary"
        >
          <AddIcon />
          Import from Text
        </Button>
      </fieldset>
    </form>
  );
}

export const Import = withStyles(styles)(_Import);
