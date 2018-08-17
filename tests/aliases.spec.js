const expect = require('chai').expect;
const getAliases = require('../alias').default;

describe('getAliases', () => {

  it('should support a string', () => {
    expect(getAliases('a')).to.eql({ a: 'a' });
  });
  
  it('should support strings', () => {
    expect(getAliases('a, b')).to.eql({ a: 'a', b: 'b' });
  });

  it('should parse unquoted aliases', () => {
    expect(getAliases('1 + 1 AS Two')).to.eql({ Two: '1 + 1' });
  });

  it('should parse quoted aliases', () => {
    expect(getAliases('1 + 1 AS "anything can go here"')).to.eql({ 'anything can go here': '1 + 1' });
  });

  it('should support functions', () => {
    const expression = 'MAX(1, NULL, MIN(200, F(x)))';
    expect(getAliases(expression + ' AS func')).to.eql({ func: expression });
  });

  it('should support single quotes', () => {
    const expression = '\'two\'';
    expect(getAliases(expression + ' AS str')).to.eql({ str: expression });
  });

  it('should support double quotes', () => {
    const expression = '"I\'m a string and can contain AS and ((such]]."';
    expect(getAliases(expression + ' AS str')).to.eql({ str: expression });
  });

  it('should support functions and strings', () => {
    const expression = 'CONCAT("strings ((", MIN(1, 2), \'no end\')';
    expect(getAliases(expression + ' AS duo')).to.eql({ duo: expression });
  });

  it('should support multiple complex aliases', () => {
    const expression = 'CONCAT("strings ((", MIN(1, 2), \'no end\')';
    const expression2 = 'DO(THE(THING), MAX(1, 2), \'string"\', "string")';
    expect(getAliases(expression + ' AS one, ' + expression2 + ' AS two')).to.eql({ one: expression, two: expression2 });
  });
});
