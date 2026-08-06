import type { GetStaticProps, GetStaticPaths } from "next";
import { Main } from "../../components/Layouts";
import { baseUrl, SEO } from "../../components/SEO";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { LinkShare } from "../../components/Links";
import Link from "next/link";
import formatDate from "../../lib/formatDate";
import { getPostBySlug, getPublishedPostSlugs } from "../../lib/sanity";
import PortableText from "../../components/PortableText";
import { extractHeaders, filterHeadersByDepth, calculateReadingTime } from "../../lib/portableTextUtils";
import type { PortableTextBlock } from '@portabletext/types';

export default function Post(props) {
  const router = useRouter();
  const { title, date, meta, tldr, content, headers, readingTime, author } = props;
  const slug = router.query.slug;
  const relativeUrl = `/posts/${slug}`;
  const url = `${baseUrl}${relativeUrl}`;
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      let currentSection = '';
      const scrollPosition = window.scrollY + 50;

      headers.forEach(header => {
        const headerSlug = header.text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
        const element = document.getElementById(headerSlug);

        if (element && element.offsetTop <= scrollPosition) {
          currentSection = headerSlug;
        }
      });

      // Activate last header when it's visible AND near page bottom
      if (headers.length > 0) {
        const lastHeader = headers[headers.length - 1];
        const lastHeaderSlug = lastHeader.text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
        const lastElement = document.getElementById(lastHeaderSlug);
        
        if (lastElement) {
          const lastHeaderTop = lastElement.offsetTop;
          const viewportTop = window.scrollY;
          const viewportBottom = window.scrollY + window.innerHeight;
          const scrollRoomLeft = document.documentElement.scrollHeight - viewportBottom;
          
          // Is last header visible in viewport?
          const lastHeaderVisible = lastHeaderTop >= viewportTop && lastHeaderTop <= viewportBottom;
          
          // Activate if visible AND less than 300px scroll room left
          if (lastHeaderVisible && scrollRoomLeft < 300) {
            currentSection = lastHeaderSlug;
          }
        }
      }

      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headers]);

  return (
    <>
      <SEO
        seo={{
          title: title || "Loading...",
          description: tldr,
          path: relativeUrl,
          image: `${baseUrl}/api/og?title=${encodeURIComponent(title)}`,
          article: {
            datePublished: date,
            author: author,
          },
          }} 
      /> 
      <Main>
        <div className="flex w-full flex-col justify-between sm:flex-row sm:mb-0 mb-4">
          <header><h1 className="text-xl text-neutral-800 [font-variation-settings:'opsz'_32,_'wght'_500] dark:text-white sm:pb-6 sm:text-xl sm:mb-0 mb-4">
            {title}
          </h1></header>
          <div className="flex gap-2">
            <LinkShare title={title} url={url}>
              Share
            </LinkShare>
          </div>
        </div>
        <div className="post-layout">
          {/* Left sidebar - TOC (fixed on xl screens) */}
          <aside className="post-sidebar-left">
            <h3 className="pb-1">Table of Contents</h3>
            <ul className="sidebar toc w-full">
              {headers.map((header, index) => {
                const headerSlug = header.text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
                return (
                  <li 
                    key={index} 
                    className={`toc-item leading-6 truncate ${activeSection === headerSlug ? 'toc-active' : ''}`} 
                    style={{ marginLeft: `${header.depth - 1}rem` }}
                  >
                    <a href={`#${headerSlug}`}>{header.text}</a>
                  </li>
                );
              })}
            </ul>
            <div className="mt-6">
              <Link href="/posts" className="text-neutral-500 dark:text-silver-dark hover:text-neutral-800 dark:hover:text-silver transition-colors text-sm">
                ← All posts
              </Link>
            </div>
          </aside>

          {/* Main content */}
          <div className="post-content">
            <div className="post-date-mobile xl:hidden">
              <h3 className="pb-1">Date</h3>
              <p className="sidebar">
                <time className="time" dateTime={date}>
                  <span className="sr-only">{date}</span>
                  {formatDate(date, false)}
                </time>
              </p>
            </div>
            <p className="text-neutral-700 dark:text-silver-dark mb-6">{readingTime} minute(s)</p>
            <div className="prose-custom">
              <PortableText content={content} />
            </div>
          </div>

          {/* Right sidebar - Meta (not sticky) */}
          <aside className="post-sidebar-right">
            <h3>Date</h3>
            <p>
              <time className="time" dateTime={date}>
                <span className="sr-only">{date}</span>
                {formatDate(date, false)}
              </time>
            </p>
            <h3>Tl;dr</h3>
            <p className="sidebar">{tldr}</p>
            {meta && (
              <>
                <h3>Meta</h3>
                <p className="sidebar">{meta}</p>
              </>
            )}
          </aside>
        </div>
      </Main>
    </>
  );
}

export const getStaticProps = async (context) => {
  const slug = context.params?.slug as string;
  // Check if preview/draft mode is enabled
  const isDraftMode = context.preview === true;
  const post = await getPostBySlug(slug, isDraftMode);

  if (!post) {
    return {
      notFound: true,
    };
  }

  const content = post.content as PortableTextBlock[];
  
  // Extract headers from Portable Text
  let headers = extractHeaders(content);
  
  // Filter headers based on the optional 'depth' variable
  const maxDepth = post.depth || Infinity;
  headers = filterHeadersByDepth(headers, maxDepth);
  
  // Calculate reading time
  const readingTime = calculateReadingTime(content);

  return {
    props: {
      title: post.title,
      date: post.date,
      author: post.author,
      tldr: post.tldr,
      meta: post.meta,
      category: post.category,
      depth: post.depth || null,
      content,
      headers,
      readingTime,
      isDraft: false, // Only published posts are accessible via getStaticPaths
    },
    // Revalidate every hour (3600 seconds) to pick up new content
    revalidate: 3600,
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getPublishedPostSlugs();
  const paths = posts.map((post) => ({
    params: { slug: post.slug.current },
  }));

  return {
    paths,
    fallback: 'blocking',
  };
};
