/** สัญญาของตัว hash รหัสผ่าน — use case รู้จักแค่ interface นี้ (impl อยู่ infrastructure) */
export interface IPasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}
