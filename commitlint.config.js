export default {
  parserPreset: {
    parserOpts: {
      headerPattern: /^(.*)$/,
      headerCorrespondence: ['subject'],
    },
  },
  rules: {
    'subject-empty': [2, 'never'],
    'header-max-length': [2, 'always', 100],
  },
};
