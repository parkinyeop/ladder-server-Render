const fs = require('fs-extra');
const path = require('path');

// 서버의 build 폴더 경로
const serverBuildPath = path.join(__dirname, '../build');
// 서버 public 폴더 경로
const serverPublicPath = path.join(__dirname, '../public');

async function deployClient() {
    try {
        // public 폴더가 없으면 생성
        await fs.ensureDir(serverPublicPath);
        
        // 기존 파일 삭제
        await fs.emptyDir(serverPublicPath);
        
        // 서버의 build 폴더에서 파일 복사
        await fs.copy(serverBuildPath, serverPublicPath);
        
        console.log('✅ 빌드 파일이 서버 public 폴더에 성공적으로 배포되었습니다.');
    } catch (error) {
        console.error('❌ 배포 중 오류 발생:', error);
    }
}

deployClient(); 