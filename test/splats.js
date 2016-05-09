{
  locals: {
    splat: {
      splata: 'value'
    },
    splat1: {
      'some-value': 'value',
      'some-code': '<script>var bad = alert();</script>',
    },
    splat2: {
      'bad-code': '"><script>var bad = alert();</script>',
      number: 123,
      'a-null': null,
    },
    splat3: {
      splata: 'another value'
    }
  }
}