import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
const dated = (name: string) => defineCollection({
  loader: glob({ pattern: ['**/*.md', '!**/template.md'], base: `./src/content/${name}` }),
  schema: z.object({ title: z.string(), subtitle: z.string().optional(), order: z.number().int().positive().optional(), legacySlug: z.string().regex(/^[a-z0-9-]+$/).optional(), level: z.number().int().positive(), reading: z.boolean().default(false), date: z.coerce.date(), preview: z.string().trim().default(''), status: z.string().optional(), publications: z.boolean().default(false) })
});
export const collections = {
  pages: defineCollection({
    loader: glob({ pattern: ['*.md', '!template.md'], base: './src/content/pages' }),
    schema: z.object({ title: z.string(), subtitle: z.string().optional(), level: z.number().int().positive(), reading: z.boolean().default(false), menuTitle: z.string().default('Enrico Lepre'), image: z.string(), imageAlt: z.string(), footer: z.string() })
  }),
  research: dated('research'), notes: dated('notes'),
  tools: defineCollection({
    loader: glob({ pattern: ['*.md', '!template.md'], base: './src/content/tools' }),
    schema: z.object({ title: z.string(), level: z.number().int().positive(), reading: z.boolean().default(true), preview: z.string().trim().default('') })
  }),
  sections: defineCollection({
    loader: glob({ pattern: ['*.md', '!template.md'], base: './src/content/sections' }),
    schema: z.object({ title: z.string(), subtitle: z.string().optional(), level: z.number().int().positive(), reading: z.boolean().default(false), portrait: z.string().optional(), portraitAlt: z.string().default('Portrait'), lead: z.string().default(''), preview: z.string().trim().default('') })
  })
};
