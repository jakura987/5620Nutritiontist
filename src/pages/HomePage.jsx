import React, { useEffect, useState } from 'react';
import { Container, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions } from '@mui/material';

import { db } from '../firebaseConfig';
import { collection, getDocs, updateDoc, doc, orderBy, query } from "firebase/firestore";
import axios from 'axios';

function HomePage() {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [aiResponse, setAiResponse] = useState('');  // 新增的状态变量(AI response)


    useEffect(() => {
        async function fetchData() {
            const userCollection = collection(db, "users");
            //创建查询, 根据 id 字段进行升序排序
            const userQuery = query(userCollection, orderBy("id"));
            const userSnapshot = await getDocs(userQuery);
            const userList = userSnapshot.docs.map(doc => ({
                ...doc.data(),
                docId: doc.id  // 这里将文档的 ID 存储为 docId 属性
            }));
            setUsers(userList); // 获取数据库里的user数据
        }

        fetchData();
    }, []);

    const handleDetailClick = (user) => { //查看用户详细信息
        setSelectedUser(user);
        setAiResponse(user.advice || '');  // 如果 user.advice 不存在或为空，则设置为 ''
    };
    

    const handleClose = () => { //关闭用户详细信息页面
        setSelectedUser(null);
    };


    const handleConfirmClick = async () => { //Nutritiontist 提交给该用户的建议
        if (selectedUser) {
            const userDoc = doc(db, "users", selectedUser.docId); // 使用 selectedUser 的 docId 属性作为文档的 ID
            await updateDoc(userDoc, { advice: aiResponse });  // 使用 aiResponse 作为建议内容
            // 更新本地状态
            const updatedUsers = users.map(user => {
                if (user.docId === selectedUser.docId) {
                    return { ...user, advice: aiResponse };  // 使用 aiResponse 更新建议内容
                }
                return user;
            });
            setUsers(updatedUsers);
            handleClose();
        }
    };


    
    
    const analysisByAI = async () => { //AI 自动分析
        if (selectedUser) {
            const inputMessage = `请提供个性化的饮食建议和食谱根据身高(简短分析下就行,100字左右): ${selectedUser.height} cm, 体重: ${selectedUser.weight} kg, 健康状况: ${selectedUser.healthStatus}, 饮食习惯: ${selectedUser.dietHabits}, 性别: ${selectedUser.gender}, 年龄: ${selectedUser.age}岁。`;
            // const inputMessage = `repeat 性别: ${selectedUser.gender}`
            try {
                const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                    model: "gpt-3.5-turbo",
                    messages: [{
                        role: "user",
                        content: inputMessage
                    }],
                    temperature: 0.7
                }, {
                    headers: {
                        'Authorization': `Bearer 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`, // 使用你的API key
                        'Content-Type': 'application/json',
                    }
                });
    
                if (response.data && response.data.choices && response.data.choices.length > 0) {
                    let answer = response.data.choices[0].message.content.trim();
                    setAiResponse(answer);  // 将 GPT-3 返回的数据设置为 aiResponse 的状态
                }
            } catch (error) {
                console.error("Error connecting to OpenAI:", error);
            }
        }
        
    };


    return (
        <Container>
            <Typography variant="h4" align="center" marginBottom={3}>
                用户表
            </Typography>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Age</TableCell>
                        <TableCell>Gender</TableCell>
                        <TableCell>Operation</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {users.map(user => (
                        <TableRow key={user.id}>
                            <TableCell>{user.id}</TableCell>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{user.age}</TableCell>
                            <TableCell>{user.gender}</TableCell>
                            <TableCell>
                                <Button variant="contained" color="primary" onClick={() => handleDetailClick(user)}>
                                    Detail
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* 用户详细信息的弹窗 */}
            {/* 用户详细信息的弹窗 */}
            <Dialog open={!!selectedUser} onClose={handleClose} fullWidth maxWidth="md">
                <DialogTitle>User Detail</DialogTitle>
                <DialogContent>
                    {selectedUser && (
                        <div>
                            <DialogContentText>Height: {selectedUser.height} cm</DialogContentText>
                            <DialogContentText>Weight: {selectedUser.weight} kg</DialogContentText>
                            <DialogContentText>health Condition: {selectedUser.healthStatus}</DialogContentText>
                            <DialogContentText>dietary habits: {selectedUser.dietHabits}</DialogContentText>
                            <TextField
                                fullWidth
                                label="Dr.Bob's advice"
                                variant="outlined"
                                multiline
                                rows={4}
                                value={aiResponse}
                                onChange={(e) => setAiResponse(e.target.value)}  // 更新 aiResponse 的状态
                                margin="normal"
                            />
                        </div>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={analysisByAI} color="primary">  {/* 调用 analysisByAI 方法 */}
                        Analysis
                    </Button>
                    <Button onClick={handleClose} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmClick} color="primary">
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>

        </Container>
    );
}

export default HomePage;
