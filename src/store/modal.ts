import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// 모달 상태 타입
export interface 모달Type {
  글제목: string;
  글내용: string;
  날짜: string;
  isOpen: boolean;
}
const initialState: 모달Type = {
    "글제목": '',
    "글내용": '',
    "날짜": '',
    isOpen: true
}

const modal = createSlice({
    name:'모달',
    initialState,
    reducers: {
        // 액션메서드 => 섹션3 데이터 전송
        setModalCotentsAction(
            state, 
            action: PayloadAction<{글제목:string, 글내용:string, 날짜:string}>
        ){
            state.글제목 = action.payload.글제목;
            state.글내용 = action.payload.글내용;
            state.날짜 = action.payload.날짜;
        },
        // 모달 창 => 열기 / 닫기
        setModalAction(
            state, 
            action: PayloadAction<boolean>
        ){
            state.isOpen = action.payload
        }
    }
});

export default modal.reducer;
export const {setModalCotentsAction, setModalAction} = modal.actions;
