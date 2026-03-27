import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'http://localhost:4000/graphql',
  documents: [
    'src/**/*.graphql',
    'src/**/*.tsx',
    'src/**/*.ts',
  ],
  generates: {
    'src/generated/graphql.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-graphql-request',
      ],
      config: {
        // Generated 파일 설정
        skipTypename: false,
        withHooks: true,
        // React hooks를 생성할지 여부
        // (optional: typescript-react-query 플러그인 사용 시 필요)
      },
    },
  },
};

export default config;
