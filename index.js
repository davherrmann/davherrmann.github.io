const fs = require('fs')
const fse = require('fs-extra')
const glob = require('glob')
const moment = require('moment')
const path = require('path')
const {createFile, createLink} = require('ritter')
const {plugins: {render, raw, read, markdown, minifyCss, minifyHtml, yamlFrontMatter}} = require('ritter')

const doc = createFile({
  baseUrl: 'https://i.love.software/',
  copyright: '© David Herrmann',
  color: '#49045f',
  description: 'code by David Herrmann',
  menu: [
    {name: 'Blog', url: 'blog/'}
  ],
  source: './site',
  title: 'I ♡ SOFTWARE'
})

const dependencies = []

const link = createLink(dependencies)

const preventCaching = url => url + '?v=aljv5RGPao'

const header = ({configuration, file}) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1">

    <link rel="apple-touch-icon" sizes="180x180" href="${preventCaching(link(doc('apple-touch-icon.png', raw())))}">
    <link rel="icon" type="image/png" href="${preventCaching(link(doc('favicon-32x32.png', raw())))}" sizes="32x32">
    <link rel="icon" type="image/png" href="${preventCaching(link(doc('favicon-16x16.png', raw())))}" sizes="16x16">
    <link rel="manifest" href="${preventCaching(link(doc('manifest.json', read())))}">
    <link rel="mask-icon" href="${preventCaching(link(doc('safari-pinned-tab.svg', read())))}" color="${configuration.color}">
    <link rel="shortcut icon" href="${preventCaching(link(doc('favicon.ico', raw())))}">
    <meta name="apple-mobile-web-app-title" content="${configuration.title}">
    <meta name="application-name" content="${configuration.title}">
    <meta name="theme-color" content="${configuration.color}">

    <base href="${configuration.baseUrl}">

    <title>
      ${file.meta.title
        ? file.meta.title + ' &middot; ' + configuration.title
        : configuration.title}
    </title>

    <!-- TODO canonical link, rss link, language in html and body-->

    <style>${doc('css/theme.css', read(), minifyCss()).content}</style>

    <script async src="${link(doc('js/calc-results.js', read()))}"></script>

  </head>
  <body>
`

const sidebar = ({configuration, file}) => `
<div class="sidebar">
  <div class="container">
    <div class="sidebar-about">
      <a href="${configuration.baseUrl}">
        <h1>
          I <i class="icon" aria-hidden="true">${doc('images/heart-o.svg', read()).content}</i> SOFTWARE
        </h1>
      </a>
      <p class="lead">
        ${configuration.description}
      </p>
    </div>

    <ul class="sidebar-nav">
      <li><a href="/">Home</a></li>
      ${configuration.menu.map(({name, url}) => `
        <li><a href="${url}">${name}</a></li>
      `).join('')}
    </ul>

    <p class="footnote">${configuration.copyright}</p>
  </div>
</div>
`

const footer = context => `
  </body>
</html>
`

const frame = context => `
  ${header(context)}
  ${sidebar(context)}

  <div class="content container">
    ${context.file.content}
  </div>

  ${footer(context)}
`

const normalise = link => link.replace(/index.html$/, '')

const index = () => context => Object.assign({}, context, {
  file: Object.assign({}, context.file, {
    path: context.file.path.replace(/.html$/, '/index.html')
  })
})

const post = ({showLink} = {}) => ({file}) => `
  <div class="post">
    <h1 class="post-title">
      ${showLink
        ? `<a href="${normalise(link(doc(file, render(post()), render(frame), index(), minifyHtml())))}">
             ${file.meta.title}
           </a>`
        : `${file.meta.title}`
      }
    </h1>
    <span class="post-date">${moment(file.meta.date).format('LL')}</span>
    ${file.content}
  </div>
`

const blogFiles = configuration => glob.sync('blog/*.md', {cwd: configuration.source})

const posts = ({configuration}) => `
  <div class="posts">
    ${blogFiles(configuration)
      .map(path =>
        doc(path,
            read(),
            yamlFrontMatter(),
            markdown(),
            render(post({showLink: true})),
            minifyHtml()).content)
      .join('')}
  </div>
`

const title = title => context => Object.assign({}, context, {
  file: Object.assign({}, context.file, {
    meta: Object.assign({}, context.file.meta, {
      title
    })
  })
})

const postListItem = ({file}) => `
  <li>
    <span>
      <a href="${file.path}">${file.meta.title}</a>
      <time class="pull-right post-list">${moment(file.meta.date).format('LL')}</time>
    </span>
  </li>
`

const postList = ({configuration, file}) => `
  <h1 class="title">${file.meta.title}</h1>
  <ul class="posts">
    ${blogFiles(configuration)
      .map(path =>
        doc(path,
            read(),
            yamlFrontMatter(),
            render(postListItem)).content).join('')}
  </ul>
`

link(doc('blog/index.html', title('Blog'), render(postList), render(frame)))

const homeFile = doc('index.html', render(context => `
  ${header(context)}
  ${sidebar(context)}

  <div class="content container">
    ${posts(context)}
  </div>

  ${footer(context)}
`), minifyHtml())

link(homeFile)
link(doc('CNAME', read()))
link(doc('google01a0df28d4492e88.html', read()))
link(doc('mstile-150x150.png', raw()))
link(doc('android-chrome-192x192.png', raw()))
link(doc('android-chrome-512x512.png', raw()))
console.log(dependencies.map(file => file.path))

const writeTargetFile = file => {
  const targetPath = path.join('public', file.path)
  fse.mkdirsSync(path.dirname(targetPath))
  fs.writeFileSync(targetPath, file.content)
}

dependencies.forEach(writeTargetFile)
