import { createGenerator, type Generator } from '@pandacss/generator'
import { createProject, type Project } from '@pandacss/parser'
import type { LoadConfigResult } from '@pandacss/types'
import type { Runtime } from '@pandacss/types/src/runtime'
import { Obj, pipe, tap } from 'lil-fp'
import { getChunkEngine } from './chunk-engine'
import { nodeRuntime } from './node-runtime'
import { getOutputEngine } from './output-engine'

export const createContext = (conf: LoadConfigResult) =>
  pipe(
    conf,
    createGenerator,

    Obj.assign({ runtime: nodeRuntime }),

    tap(({ config, runtime }) => {
      config.cwd ||= runtime.cwd()
    }),

    Obj.bind('getFiles', ({ config, runtime: { fs } }) => () => {
      const { include, exclude, cwd } = config
      return fs.glob({ include, exclude, cwd })
    }),

    Obj.bind('project', ({ config, getFiles, runtime: { fs, path }, parserOptions }) => {
      return createProject({
        getFiles,
        readFile: fs.readFileSync,
        exists: fs.existsSync,
        path,
        cwd: config.cwd,
        parserOptions,
        incremental: conf.config.incremental,
      })
    }),

    Obj.bind('chunks', getChunkEngine),

    Obj.bind('output', getOutputEngine),
  ) as PandaContext

export type PandaContext = Generator & {
  runtime: Runtime
  project: Project
  getFiles: () => string[]
  chunks: ReturnType<typeof getChunkEngine>
  output: ReturnType<typeof getOutputEngine>
}
