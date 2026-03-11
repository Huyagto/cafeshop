B1: DOWNLOAD WAMPSERVER
B2: VAO my.ini search default_storage_engine=InnoDB. Xoa dấu ";" ở dòng default_storage_engine=InnoDB, thêm dấu ";" ở dòng default_storage_engine=MYISAM, sau đó save lại restart wampserver.
B3: vào terminal trong visual studio code, cd vào backend chạy lệnh "npx prisma migrate dev --name init"
B4: npm i
B5: npm run dev (backend, frontend)