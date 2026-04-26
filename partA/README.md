Алдааны тайлбар:
/1.нэршлийн стандарт зөрчсөн (Naming consistency)
//2. any хэт их ашигласан (type safety)
//encapsulation зөрчсөн (Encapsulation violation)
//4.Boolean number flag ашигласан (avoid flag arguments)
//5.нэг функц олон үүрэгтэй (Single Responsibility Principle violation)
//6.Error handling буруу (Exception vs return value, type consistency)
//7. predictable API design зөрчсөн
Сайжруулатын тайлбар:
// нэрс ойлгомжгүй байсан
public get_u(...)
public do_user_op(...)

// ойлгомжтой шууд уншхад юу хийх нь ойлгож болхоор болгосон
async findUserById(...)
async createUser(...)

// классын дотоод зүйлс тул public байж болохгүй
public db_conn: any;
public users_arr: Array<any> = [];

// private болгож зассан
private readonly db: DatabaseConnection;
private readonly userCache: Map<string, User> = new Map();

// өмнөх — нэг функц дөрвөн зүйл хийдэг
public do_user_op(obj: any, flag: number, timeout: number): any

//тус тусдаа функцүүд болгсон
async createUser(input: CreateUserInput): Promise<User>
async updateUser(userId: string, input: UpdateUserInput): Promise<User>
async deleteUser(userId: string): Promise<void>
async restoreUser(userId: string): Promise<User>

// any хэтэрхий их ашигласан байсан
public do_user_op(obj: any, flag: number): any
public users_arr: Array<any> = [];

// зассан interface 
interface User { id: string; email: string; name: string; }
async createUser(input: CreateUserInput): Promise<User>

// өмнөх
public get_u(id_or_email: string, flag: number): string  // 'ERR_404' буцаадаг

//  exception ашиглан зассаэ
async findUserById(userId: string): Promise<User>  // олдохгүй бол throw хийдэг

// Хэрэглэгч SQL-ийн алдааг барьж байх ёсгүй  энэ нь дотоод мэдээлэл. Өгөгдлийн санг солих гэвэл бүх catch кодыг өөрчлөх хэрэгтэй болдог.
public find(q: string): any[] { /* throws SQLException */ }

// зассан дотооддоо барьж domain алдаа болгодог
async searchUsers(query: string): Promise<User[]>

// хоёр өөр хайлт нэгтгэсэн байсан
public get_u(id_or_email: string, flag: number): string

// тусдаа функцүүд болгосон
async findUserById(userId: string): Promise<User>
async findUserByEmail(email: string): Promise<User>

// timeout параметр буруу газар байсан
public do_user_op(obj: any, flag: number, timeout: number): any

// зассан
constructor(db: DatabaseConnection, options?: { queryTimeoutMs?: number }) {}

Сангийн дизайны шийдвэрлэлт:
1. ICache интерфейс —Хэрэглэгч cache дотор яг ямар төрөл (LRU, LFU, TTL) байгааг мэдэх шаардлагагүй
Зөвхөн get(), set() гэх мэт функцүүдийг ашиглана
2. CacheFactory — Энэ класс зөвхөн cache үүсгэх үүрэгтэй new CacheFactory() гэж ашиглах шаардлагагүй
CacheFactory.create("lru") гэж шууд дуудна. Шинэ төрлийн cache нэмэхэд ганцхан газар өөрчилнө бусад код огт өөрчлөгдөхгүй
3. LRUCache — Map/хурдан хайна/,Linked List/дараалал хадгална/,get() дуудах/тэр элементийг “хамгийн шинэ” болгоно/, Хэт их болвол/хамгийн хуучин-ыг устгана/
4. LFUCache — хамгийн бага ашигласан өгөгдлийг устгана. Хэдэн удаа ашигласныг тоолно (frequency). Ижил тохиолдолд хамгийн түрүүнд орсон-ыг устгана
5. TTLCache — Хоёр аргаар устгана: Lazy eviction-get() хийхэд хугацаа дууссан байвал шууд устгана.
Background sweep-Цаанаасаа тодорхой хугацаанд шалгаж устгана.
Хэрэглэгч гараар цэвэрлэх шаардлагагүй
6. Generic <K, V> — Cache-д ямар ч төрлийн өгөгдөл хийж болно string, number, object бүгд боломжтой
Алдаа compile үед илэрнэ (аюулгүй)

