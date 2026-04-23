export class usr_mgr {//1.нэршлийн стандарт зөрчсөн (Naming consistency)

public db_conn: any;//2. any хэт их ашигласан (type safety)

public users_arr: Array<any> = []; //encapsulation зөрчсөн (Encapsulation violation)

// flag: 0=create, 1=update, 2=delete, 3=restore   //4.Boolean number flag ашигласан (avoid flag arguments)


public do_user_op(obj: any, flag: number, timeout: number): any { /* ... */ } //5.нэг функц олон үүрэгтэй (Single Responsibility Principle violation)

// returns user as JSON string, or 'ERR_404' string if not found   //6.Error handling буруу (Exception vs return value, type consistency)

public get_u(id_or_email: string, flag: number): string { /* ... */ return ''; }//7. predictable API design зөрчсөн

public find(q: string): any[] { /* throws SQLException */ return []; }

}