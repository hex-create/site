import { PortableText as SanityPortableText } from '@portabletext/react'
import type { PortableTextBlock, PortableTextMarkDefinition } from '@portabletext/types'
import { LinkExternal } from '../Links'
import { HoverNote } from '../HoverNote'
import { TextDiagram } from '../TextDiagram'

interface PortableTextProps {
  content: PortableTextBlock[]
}

// Custom block renderer for Aside (grayed out text)
const AsideBlock = ({ value }: { value: any }) => {
  if (!value.content) return null
  
  return (
    <div className="aside-block [&_*]:!text-neutral-500 dark:[&_*]:!text-silver-dark">
      <SanityPortableText value={value.content} components={defaultComponents} />
    </div>
  )
}

// Custom block renderer for Note (bordered box)
const NoteBlock = ({ value }: { value: any }) => {
  if (!value.content) return null
  
  return (
    <div className="note-block my-6">
      <SanityPortableText value={value.content} components={defaultComponents} />
    </div>
  )
}

// Custom block renderer for Text Diagram
const TextDiagramBlock = ({ value }: { value: any }) => {
  if (!value.content) return null
  
  return (
    <TextDiagram 
      content={value.content} 
      caption={value.caption}
      captionPosition={value.captionPosition}
      minWidth={value.minWidth}
    />
  )
}

// Custom block renderer for Table
const TableBlock = ({ value }: { value: any }) => {
  if (!value.rows || !Array.isArray(value.rows) || value.rows.length === 0) return null
  
  return (
    <div className="my-6 overflow-x-auto">
      <table className="min-w-full border-collapse border border-neutral-300 dark:border-neutral-700">
        <tbody>
          {value.rows.map((row: any, rowIndex: number) => {
            const cells = row.cells || row // Support both new format (row.cells) and old format (row is array)
            const cellArray = Array.isArray(cells) ? cells : []
            
            return (
              <tr key={rowIndex} className={rowIndex === 0 ? 'bg-neutral-100 dark:bg-neutral-800' : ''}>
                {cellArray.map((cell: any, cellIndex: number) => {
                  const Tag = cell.isHeader || rowIndex === 0 ? 'th' : 'td'
                  return (
                    <Tag
                      key={cellIndex}
                      className={`border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-left ${
                        cell.isHeader || rowIndex === 0
                          ? 'font-medium bg-neutral-100 dark:bg-neutral-800'
                          : ''
                      }`}
                    >
                      {cell.content ? (
                        <SanityPortableText value={cell.content} components={defaultComponents} />
                      ) : (
                        ''
                      )}
                    </Tag>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// Custom components for Portable Text
const defaultComponents = {
  types: {
    aside: AsideBlock,
    note: NoteBlock,
    table: TableBlock,
    textDiagram: TextDiagramBlock,
  },
  marks: {
    link: ({ value, children }: any) => {
      const href = value?.href || ''
      return (
        <a href={href} className="link" target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      )
    },
    linkExternal: ({ value, children }: any) => {
      const href = value?.href || ''
      return <LinkExternal href={href}>{children}</LinkExternal>
    },
    code: ({ children }: any) => <code>{children}</code>,
    strong: ({ children }: any) => <strong>{children}</strong>,
    em: ({ children }: any) => <em>{children}</em>,
  },
  block: {
    h1: ({ children, value }: any) => {
      const id = childrenToString(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
      return <h1 id={id} data-block-key={value._key}>{children}</h1>
    },
    h2: ({ children, value }: any) => {
      const id = childrenToString(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
      return <h2 id={id} data-block-key={value._key}>{children}</h2>
    },
    h3: ({ children, value }: any) => {
      const id = childrenToString(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
      return <h3 id={id} data-block-key={value._key}>{children}</h3>
    },
    h4: ({ children, value }: any) => {
      const id = childrenToString(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
      return <h4 id={id} data-block-key={value._key}>{children}</h4>
    },
    h5: ({ children, value }: any) => {
      const id = childrenToString(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
      return <h5 id={id} data-block-key={value._key}>{children}</h5>
    },
    h6: ({ children, value }: any) => {
      const id = childrenToString(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
      return <h6 id={id} data-block-key={value._key}>{children}</h6>
    },
    normal: ({ children, value }: any) => <p data-block-key={value._key}>{children}</p>,
    blockquote: ({ children, value }: any) => (
      <blockquote className="border-l-4 border-neutral-300 dark:border-neutral-700 pl-4 italic text-neutral-600 dark:text-silver-dark my-6" data-block-key={value._key}>
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }: any) => <ul className="!list-disc !my-4 !space-y-2 !pl-6 list-outside">{children}</ul>,
    number: ({ children }: any) => <ol className="!list-decimal !my-4 !space-y-2 !pl-6 list-outside">{children}</ol>,
  },
  listItem: {
    bullet: ({ children }: any) => <li className="!ml-0">{children}</li>,
    number: ({ children }: any) => <li className="!ml-0">{children}</li>,
  },
}

function childrenToString(children: any): string {
  if (typeof children === 'string') return children
  if (Array.isArray(children)) {
    return children.map(child => childrenToString(child)).join('')
  }
  if (children?.props?.children) {
    return childrenToString(children.props.children)
  }
  return ''
}

export default function PortableText({ content }: PortableTextProps) {
  return <SanityPortableText value={content} components={defaultComponents} />
}

