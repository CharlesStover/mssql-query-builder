const expect = require('chai').expect;
const mssql = require('mssql');
const QueryBuilder = require('../index');

// mock ConnectionPool
mssql.ConnectionPool = function() {
  this.request = () => Promise.resolve();
};

describe('mssql-query-builder', () => {

  it('should construct', () => {
    new QueryBuilder();
  });

  let qb = null;
  beforeEach(() => {
    qb = new QueryBuilder();
  });

  // ALL
  describe('all', () => {

    it('should support true', () => {
      expect(qb
        .select('a')
        .all(true)
        .buildQuery()
      ).to.equal('SELECT ALL a AS "a";');
    });

    it('should support false', () => {
      expect(qb
        .select('a')
        .all(false)
        .buildQuery()
      ).to.equal('SELECT DISTINCT a AS "a";');
    });
  });

  // DISTINCT
  describe('distinct', () => {

    it('should support true', () => {
      expect(qb
        .select('a')
        .distinct(true)
        .buildQuery()
      ).to.equal('SELECT DISTINCT a AS "a";');
    });

    it('should support false', () => {
      expect(qb
        .select('a')
        .distinct(false)
        .buildQuery()
      ).to.equal('SELECT ALL a AS "a";');
    });

    it('should support string');
    it('should support an array of strings');
  });

  // execute()
  describe('execute', () => {
    it('should execute the built query');
    it('should execute a given query');
  });

  // FETCH
  describe('fetch', () => {

    it('should require order by', () => {
      expect(() => qb.fetch(25).buildQuery()).to.throw;
    });

    it('should support number', () => {
      expect(qb
        .fetch(25)
        .orderBy('a')
        .buildQuery()
      ).to.equal(' ORDER BY a OFFSET 0 ROWS FETCH NEXT 25 ROWS ONLY;');
    });
  });

  // FROM
  describe('from', () => {
    it('should support string', () => {
      expect(qb
        .from('a')
        .buildQuery()
      ).to.equal(' FROM a;');
    });
  });

  // GROUP BY
  describe('groupBy', () => {
    it('should support string', () => {
      expect(qb
        .groupBy('a')
        .buildQuery()
      ).to.equal(' GROUP BY a;');
    });
  });

  // HAVING
  describe('having', () => {
    it('should support string', () => {
      expect(qb
        .having('a')
        .buildQuery()
      ).to.equal(' HAVING a;');
    });
  });

  // input()
  describe('input', () => {

    // Set an input, then immediately test its value.
    const testInput = (value, type) => {
      const name = qb.input(value).substring(1);
      expect(qb._input.get(name).type).to.equal(type);
      expect(qb._input.get(name).value).to.equal(value);
    };

    it('should generate variable names', () => {
      expect(typeof qb.input(true)).to.equal('string');
    });
    it('should support boolean', () => testInput(true, mssql.Bit));
    it('should support buffer',  () => testInput(new Buffer('buffer'), mssql.VarBinary));
    it('should support date',    () => testInput(new Date(), mssql.DateTime));
    it('should support number',  () => testInput(1, mssql.Int));
    it('should support string',  () => testInput('string', mssql.NVarChar));
  });

  // OFFSET
  describe('offset', () => {

    it('should require order by', () => {
      expect(() => qb.offset(25).buildQuery()).to.throw;
    });

    it('should support number', () => {
      expect(qb
        .offset(25)
        .orderBy('a')
        .buildQuery()
      ).to.equal(' ORDER BY a OFFSET 25 ROWS;');
    });
  });

  // ORDER BY
  describe('order by', () => {

    it('should support string', () => {
      expect(qb
        .orderBy('a')
        .buildQuery()
      ).to.equal(' ORDER BY a;');
    });

    it('should support an array of strings', () => {
      expect(qb
        .orderBy([ 'a', 'b' ])
        .buildQuery()
      ).to.equal(' ORDER BY a, b;');
    });

    it('should support object', () => {
      expect(qb
        .orderBy({ by: 'a', order: 'DESC' })
        .buildQuery()
      ).to.equal(' ORDER BY a DESC;');
    });

    it('should support an array of objects', () => {
      expect(qb
        .orderBy([
          { by: 'a', order: 'DESC' },
          { by: 'b', order: 'ASC' }
        ])
        .buildQuery()
      ).to.equal(' ORDER BY a DESC, b ASC;');
    });
  });

  // query()
  describe('query', () => {

    it('should support all', () => {
      expect(qb
        .query('SELECT ALL a')
        .buildQuery()
      ).to.equal('SELECT ALL a AS "a";');
    });

    it('should support distinct', () => {
      expect(qb
        .query('SELECT DISTINCT a')
        .buildQuery()
      ).to.equal('SELECT DISTINCT a AS "a";');
    });

    it('should support fetch', () => {
      expect(qb
        .query('OFFSET 100 ROWS FETCH NEXT 25 ROWS ONLY')
        .orderBy('a')
        .buildQuery()
      ).to.equal(' ORDER BY a OFFSET 100 ROWS FETCH NEXT 25 ROWS ONLY;');
    });

    it('should support from', () => {
      expect(qb
        .query('FROM a')
        .buildQuery()
      ).to.equal(' FROM a;');
    });

    it('should support group by', () => {
      expect(qb
        .query('GROUP BY a')
        .buildQuery()
      ).to.equal(' GROUP BY a;');
    });

    it('should support having', () => {
      expect(qb
        .query('HAVING a')
        .buildQuery()
      ).to.equal(' HAVING a;');
    });

    it('should support offset', () => {
      expect(qb
        .query('OFFSET 100 ROWS')
        .orderBy('a')
        .buildQuery()
      ).to.equal(' ORDER BY a OFFSET 100 ROWS;');
    });

    it('should support order by', () => {
      expect(qb
        .query('ORDER BY a')
        .buildQuery()
      ).to.equal(' ORDER BY a;');
    });

    it('should support select', () => {
      expect(qb
        .query('SELECT a')
        .buildQuery()
      ).to.equal('SELECT ALL a AS "a";');
    });

    it('should support top', () => {
      expect(qb
        .query('SELECT TOP 10 a')
        .buildQuery()
      ).to.equal('SELECT ALL TOP 10 a AS "a";');
    });

    it('should support where', () => {
      expect(qb
        .query('WHERE a = b')
        .buildQuery()
      ).to.equal(' WHERE a = b;');
    });

    it('should support where in', () => {
      expect(qb
        .query('WHERE a IN (1, 2)')
        .buildQuery()
      ).to.equal(' WHERE a IN (1, 2);');
    });
      
  });

  // recordSet()
  describe('record set', () => {

    it('should support function', () => {
      expect(() => qb.recordSet(() => {})).not.to.throw;
    });

    it('should support number', () => {
      expect(() => qb.recordSet(0)).not.to.throw;
    });
  });

  // rowCount()
  describe('row count', () => {
    it('should return row count');
  });

  // SELECT
  describe('select', () => {

    it('should support string', () => {
      expect(qb
        .select('a')
        .buildQuery()
      ).to.equal('SELECT ALL a AS "a";');
    });

    it('should support an array of strings', () => {
      expect(qb
        .select(
          'column_name AS "alias1"',
          'expression() AS "alias2"',
          'CONCAT("with quotes", (1 + 1), \'and commas\') AS "alias3"',
          '", \\ , \\" \' " AS "alias4"'
        )
        .buildQuery()
      ).to.equal(
        'SELECT ALL ' +
        'column_name AS "alias1", ' +
        'expression() AS "alias2", ' +
        'CONCAT("with quotes", (1 + 1), \'and commas\') AS "alias3", ' +
        '", \\ , \\" \' " AS "alias4";'
      );
    });

    it('should support aliases', () => {
      expect(qb
        .select({
          alias1: 'column_name',
          alias2: 'expression()',
          alias3: 'CONCAT("with quotes", (1 + 1), \'and commas\')',
          alias4: '", \\ , \\" \' "'
        })
        .buildQuery()
      ).to.equal(
        'SELECT ALL ' +
        'column_name AS "alias1", ' +
        'expression() AS "alias2", ' +
        'CONCAT("with quotes", (1 + 1), \'and commas\') AS "alias3", ' +
        '", \\ , \\" \' " AS "alias4";'
      );
    });
  });

  // time()
  describe('time', () => {
    it('should be 0 before the query has started', () => {
      expect(qb.time()).to.equal(0);
    });
    it('should be negative while the query is running');
    it('should be positive when the query has completed');
  });

  // TOP
  describe('top', () => {
    it('should support number', () => {
      expect(qb
        .select('a')
        .top(10)
        .buildQuery()
      ).to.equal('SELECT ALL TOP 10 a AS "a";');
    });
  });

  // WHERE
  describe('where', () => {

    it('should support string', () => {
      expect(qb
        .where('a = b')
        .buildQuery()
      ).to.equal(' WHERE a = b;');
    });

    it('should support an array of strings', () => {
      expect(qb
        .where(
          'a = b',
          'c = d'
        )
        .buildQuery()
      ).to.equal(' WHERE a = b AND c = d;');
    });
  });

  // WHERE IN
  describe('where in', () => {
    it('should support an array', () => {
      expect(qb
        .whereIn('a', [ true, 1, 'x', new Date() ])
        .buildQuery()
      ).to.equal(' WHERE a IN (@' + Array.from(qb._input.keys()).join(', @') + ');')
    });
  });
});
