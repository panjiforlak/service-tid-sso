import { generateTrxId } from 'src/common/helpers/common.helper';

describe('CommonHelper', () => {
  describe('generateTrxId', () => {
    it('should generate a transaction ID with correct format', () => {
      const trxId = generateTrxId();
      
      // Should be a string
      expect(typeof trxId).toBe('string');
      
      // Should start with 'TID'
      expect(trxId).toMatch(/^TID/);
      
      // Should have correct length (TID + mode + date + random)
      expect(trxId).toHaveLength(25);
      
      // Should contain only alphanumeric characters after TID
      expect(trxId.substring(3)).toMatch(/^[A-Z0-9]+$/);
    });

    it('should generate unique transaction IDs', () => {
      const trxId1 = generateTrxId();
      const trxId2 = generateTrxId();
      
      expect(trxId1).not.toBe(trxId2);
    });

    it('should generate multiple unique IDs', () => {
      const ids = Array.from({ length: 100 }, () => generateTrxId());
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(100);
    });

    it('should generate ID with custom prefix', () => {
      const trxId = generateTrxId('CUSTOM');
      
      expect(trxId).toMatch(/^CUSTOM/);
      expect(trxId).toHaveLength(28);
    });

    it('should generate ID with production mode when NODE_ENV is production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const trxId = generateTrxId();
      
      expect(trxId).toMatch(/^TIDPRD/);
      expect(trxId).toHaveLength(25);
      
      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should generate ID with development mode by default', () => {
      const originalEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;
      
      const trxId = generateTrxId();
      
      expect(trxId).toMatch(/^TIDDEV/);
      expect(trxId).toHaveLength(25);
      
      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });
  });
});
