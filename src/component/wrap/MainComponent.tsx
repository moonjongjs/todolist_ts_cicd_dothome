import React, { useState, useRef, useMemo, useEffect } from 'react';
import "./scss/MainComponent.scss";
import { 
    format, 
    startOfWeek, endOfWeek, 
    startOfMonth, endOfMonth,    
    startOfYear, endOfYear,
    subWeeks, addWeeks,
    subMonths, addMonths,
    subYears, addYears

} from 'date-fns';

export default function MainComponent() {

    const [sort, setSort] = useState<string>("dateAsc"); // 정렬 상태

    const [period, setPeriod] = useState<string>("전체기간");  // 기간 필터
    const [condition, setCondition] = useState<string>("할일"); // 조건 필터
    const [keyword, setKeyword] = useState<string>("");        // 검색어

    // 만료일
    // const [expires, setExpires] = useState<string>(new Date().toISOString().slice(0, 16));
    const [expires, setExpires] = useState<string>(format(new Date(), 'yyyy-MM-dd HH:mm'));
    // 입력값 예: "2025-09-19T14:30"
    // const saveExpires = expires.replace('T', ' ') + ':00';    
    // 결과: "2025-09-19 14:30:00"
    // const display = expires ? format(new Date(expires), 'yyyy-MM-dd HH:mm') : '';


    // 수정 상태 관리
    const [editId, setEditId] = useState<number | null>(null);
    const [editText, setEditText] = useState<string>('');


    // D-Day 계산 (날짜는 0시 기준으로 비교)
    const getDDay = (expires: Date | null): { label: string; color: string } => {
        if (!expires) return { label: "", color: "inherit" };

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const exp = new Date(expires);
        exp.setHours(0, 0, 0, 0);

        const diffDays = Math.floor((exp.getTime() - today.getTime()) / 86400000);

        if (diffDays > 0) return { label: `[D-${diffDays}]`, color: "green" };
        if (diffDays === 0) return { label: "[D-DAY]", color: "orange" };
        return { label: "[만료]", color: "#c00" };
    };


    // 고유 ID 관리
    const idx = useRef<number>(1);    
    const todoInputRef = useRef<HTMLInputElement | null>(null);
    const editTextRef = useRef<HTMLInputElement | null>(null);
    const todoSearchRef = useRef<HTMLInputElement | null>(null);

    // 할일 입력상자 입력 상태
    const [state, setState] = useState<{할일:string}>({
        할일: ''
    });    

    // 삭제 모드 복구 모드
    const [showDeleted, setShowDeleted] = useState<boolean>(false);

    // 할일목록 타입    
    type 할일목록Type = {
        idx: number,
        할일: string,
        날짜: Date,
        만료일: Date | null;  // null 허용
        완료: boolean,
        삭제: boolean
    }

    // 검색
    const [검색결과, set검색결과] = useState<할일목록Type[]>([]);

    // const [할일목록, set할일목록] = useState<할일목록Type[]>([]);
    const [할일목록, set할일목록] = useState<할일목록Type[]>(()=>{
        // const saved = localStorage.getItem("todos");
        // return saved ? JSON.parse(saved) : [];

        const res = localStorage.getItem("todos");
        if (res) {
            const parsed = JSON.parse(res) as 할일목록Type[];
            // 날짜 복원
            const result = parsed.map(item => ({ 
                ...item, 
                날짜: new Date(item.날짜), 
                만료일: item.만료일 ? new Date(item.만료일) : null
            }));

            // 가장 큰 idx를 찾아서 idx.current 갱신
            const maxIdx = result.reduce((acc, item) => Math.max(acc, item.idx), 0); // 배열 빈경우 초기겂 0 초소값
            idx.current = maxIdx + 1;

            return result;
        }
        return [];

    });




    // 페이지네이션 시작 /////////////////////////////////////////////////////////////////////////////
    // 페이지 카운트
    const [page, setPage] = useState<number>(1);
    
    
    /** 
     * ------------------------------
     *  파생 데이터 계산 (useMemo) 시작
     * ------------------------------ 
    **/
    // 계산만 사용하는 일반변수 선언
    const list = 5;  // 한페이지 목록 줄수

    const 삭제안된목록 = useMemo<할일목록Type[]>(() => {
        return 할일목록.filter(item => item.삭제 === false)
    }, [할일목록]);  // 할일목록이 바뀔 때만 필터 다시 수행
    
    const 삭제된목록 = useMemo<할일목록Type[]>(() => {
        return 할일목록.filter(item => item.삭제 === true)
    }, [할일목록]);  // 할일목록이 바뀔 때만 필터 다시 수행
    
    // 페이지단위 슬라이스 계산
    // 삭제 여부에 따라 기준 목록 선택
    const 할일출력목록 = useMemo<할일목록Type[]>(() => {
        return showDeleted ? 삭제된목록 : 삭제안된목록;
    }, [showDeleted, 삭제된목록, 삭제안된목록]);



    // 검색 or 삭제 필터 반영
    const 필터된목록 = useMemo<할일목록Type[]>(() => {
        return 검색결과.length > 0 ? 검색결과 : 할일출력목록;
    }, [검색결과, 할일출력목록]);

    // 정렬 적용
    const 정렬된목록 = useMemo<할일목록Type[]>(() => {
        let result = [...필터된목록];

        if (sort === "dateAsc") {
            result.sort((a, b) => {
            if (!a.만료일) return 1;
            if (!b.만료일) return -1;
            return a.만료일.getTime() - b.만료일.getTime();
            });
        } else if (sort === "dateDesc") {
            result.sort((a, b) => {
            if (!a.만료일) return 1;
            if (!b.만료일) return -1;
            return b.만료일.getTime() - a.만료일.getTime();
            });
        } else if (sort === "newest") {
            result.sort((a, b) => b.날짜.getTime() - a.날짜.getTime());
        } else if (sort === "oldest") {
            result.sort((a, b) => a.날짜.getTime() - b.날짜.getTime());
        }

        return result;
    }, [필터된목록, sort]);


    const 슬라이스 = useMemo<할일목록Type[]>(() => {
        const 시작 = (page - 1) * list;
        const 끝 = 시작 + list;
        return 정렬된목록.slice(시작, 끝);
    }, [정렬된목록,  page]);

    // 그룹 페이지네이션 계산
    const 총페이지수 = Math.ceil(정렬된목록.length / list );
    const 페이지그룹 = 5;
    const 현재그룹번호 = Math.floor((page-1)/페이지그룹);
    const 총그룹수 = Math.ceil(총페이지수 / 페이지그룹);
    const 그룹시작 = 현재그룹번호 * 페이지그룹 + 1;
    const 그룹끝 =  Math.min( (그룹시작 + 페이지그룹 - 1), 총페이지수 );
 /* const 페이지번호 = [...Array(그룹끝 - 그룹시작 + 1)].map((item, i)=>그룹시작+i); */
    const 페이지번호 = [...Array(그룹끝 - 그룹시작 + 1)].map((_, i)=>그룹시작+i);
    /** 
     * ------------------------------
     *  파생 데이터 계산 (useMemo) 끝
     * ------------------------------ 
    **/


    /** ------------------------------
     *  이벤트 핸들러 시작
     * ------------------------------ */
    // 다음, 이전, 페이지번호 클릭 이벤트
    const onClickPage=(e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, n:number)=>{
        e.preventDefault();
        setPage( n ) // 페이지 번호 변경
    }
    // 페이지네이션 끝 /////////////////////////////////////////////////////////////////////////////
    
    // CRUD 이벤트 핸들러 (저장, 체크박스, 삭제 등)
    // 할일저장함수
    const saveEvent=()=>{
        
            if(editId!==null){
                if(editText===''){
                    alert('수정 입력상자 할일을 입력하세요!');
                    return;
                }
                set할일목록(prev=>prev.map((item)=>item.idx===editId ? {...item, 할일: editText, 만료일: expires ? new Date(expires) : null} : {...item}))
                setEditId(null);
                setEditText('');
                todoInputRef.current?.focus();
            }
            else{
                if(state.할일===''){
                    alert('할일을 입력하세요!');
                    return;
                }
                set할일목록(
                    [
                        {
                            idx: idx.current,
                            할일: state.할일, 
                            날짜: new Date(),
                            만료일: expires ? new Date(expires) : null, // ⭐ 변환 추가
                            완료: false,
                            삭제: false,
                        },
                            ...할일목록
                    ]
                )
                idx.current += 1;            
                setState({할일:''})
                todoInputRef.current?.focus();
            }
           
            // todoInputRef.current!.value = "";
            /* 
                ! 는 Non-null assertion (널 아님 단언) 문법 (TypeScript 전용)
                의미: "개발자가 확실히 이 시점에서는 null이 아니다"라고 보장
            
                ?. 는 옵셔널 체이닝(optional chaining) 문법
                의미: todoInputRef.current가 null이 아닐 때만 .focus() 실행 
            */
        
    }
    
    // 할일목록이 바뀔 때마다 localStorage에 저장
    useEffect(() => {
        localStorage.setItem("todos", JSON.stringify(할일목록));
    }, [할일목록]);


    // 할일 입력상자 onChange 키 입력 이벤트
    const onChangeTodoInput=(e: React.ChangeEvent<HTMLInputElement>)=>{      
         setState({
            할일: e.target.value
         })               
    }
    
    // 키보드 엔터키 이벤트 => 할일 추가 등록
    const onKeyDownTodoInput=(e: React.KeyboardEvent<HTMLInputElement> )=>{      
         if(e.key==='Enter'){
            saveEvent();
         }
    }
    
    // 마우스 클릭 이벤트 => + 버튼 클릭 => 할일 추가 등록
    const onClickSaveBtn=(e: React.MouseEvent<HTMLButtonElement>)=>{
        e.preventDefault();
        saveEvent();
    }

    // 그룹 삭제 체크박스 이벤트 할일완료 true or false 토글
    const onChangeCheckEvent=(e: React.ChangeEvent<HTMLInputElement>, idx:number)=>{
        set할일목록(prev => prev.map(item => item.idx === idx ? { ...item, 완료: e.target.checked } : item));
    }

    // 개별 삭제 버튼 클릭 이벤트 => 할일완료항목 삭제 true 설정
    const onClickDeleteBtn=(e: React.MouseEvent<HTMLButtonElement>, idx: number)=>{
        e.preventDefault();
        set할일목록(prev => prev.map(item => item.idx === idx ? { ...item, 삭제: true } : item));
    }

    // 선택삭제 => 할일완료 체크항목 삭제 true 설정
    const onClickCheckDeleteBtn=(e:React.MouseEvent<HTMLButtonElement>)=>{
        e.preventDefault();
        set할일목록(prev =>prev.map(item => item.완료 ? { ...item, 삭제: true } : item));
    }

    // 복구 
    const onClickRestore=(e:React.MouseEvent<HTMLButtonElement>)=>{
        e.preventDefault();        
        setShowDeleted(prev => !prev);
        setPage(1);
    }

    const onClickRestoreBtn=(e:React.MouseEvent<HTMLButtonElement>, idx: number)=>{
        e.preventDefault();        
        set할일목록(prev =>prev.map(item => item.idx === idx ? { ...item, 삭제: false } : item));        
    }

    // 삭제된할일목록 없으면 할일목록 처음으로 자동 전환    
    useEffect(()=>{
        const 삭제된할일목록 = 할일목록.filter((item)=>item.삭제===true).length;
        if( 삭제된할일목록 === 0 ){
            setShowDeleted(false);
            setPage(1);
            return;
        }
    }, [할일목록]);


    // 수정 버튼 클릭 → 수정 모드 진입
    const onClickEdit = (
        e: React.MouseEvent<HTMLButtonElement> | React.MouseEvent<HTMLAnchorElement>,
        item: 할일목록Type
    ) => {
        e.preventDefault();
        
        if(editId===null){
            setEditId(item.idx);
            setEditText(item.할일);
            setExpires(item.만료일?format(item.만료일, "yyyy-MM-dd HH:mm"):'');
            editTextRef.current?.focus();
        }
        else{
            saveEvent();
        }
    };

    // 입력상자 수정 입력 이벤트
    const onChangeEditText=(e:React.ChangeEvent<HTMLInputElement>)=>{
        setEditText(e.target.value)
    }

    // 키보드 입력 엔터 이벤트
    const onKeyDownEditText=(e:React.KeyboardEvent<HTMLInputElement>)=>{
         if(e.key==='Enter'){
            saveEvent();
         }
    }


    // 할일 조건 검색
    const onSearch = () => {

        let result = [...할일목록];
        const now = new Date();

        // 모든 비교를 위해 오늘/주/월 날짜 정규화
        const normalize = (date: Date) => {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            return d;
        };

        const today = normalize(now);

        // 🔎 조건 필터
        if (condition === "할일") {
            result = result.filter((item) =>
                item.할일.toLowerCase().includes(keyword.toLowerCase())
            );

        } else if (condition === "완료된 항목") {
            result = result.filter((item) => item.완료);

        } else if (condition === "삭제된 항목") {
            result = result.filter((item) => item.삭제);

        } else if (condition === "만료된 항목") {
            result = result.filter((item) => {
            if (!item.만료일) return false;
                const target = normalize(new Date(item.만료일));
                return target < today; // 오늘 이전이면 만료
            });
        }

        // 📅 기간 필터
        if (period === "오늘") {
            result = result.filter((item) => {
            if (!item.만료일) return false;
                return normalize(new Date(item.만료일)).getTime() === today.getTime();
            });

        } else if (period === "이번 주") {
            const start = normalize(startOfWeek(now, { weekStartsOn: 1 })); // 월요일 시작
            const end = normalize(endOfWeek(now, { weekStartsOn: 1 }));     // 일요일 끝
            result = result.filter((item) => {            
                if (!item.만료일) return false;
                const target = normalize(new Date(item.만료일));
                return target >= start && target <= end;
            });

        } else if (period === "지난 주") {
            const start = normalize(startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }));
            const end = normalize(endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }));
            result = result.filter((item) => {
                if (!item.만료일) return false;
                const target = normalize(new Date(item.만료일));
                return target >= start && target <= end;
            });

        } else if (period === "다음 주") {
            const start = normalize(startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 }));
            const end = normalize(endOfWeek(addWeeks(now, 1), { weekStartsOn: 1 }));
            result = result.filter((item) => {
                if (!item.만료일) return false;
                const target = normalize(new Date(item.만료일));
                return target >= start && target <= end;
            });
           
        } else if (period === "이번 달") {
            const start = normalize(startOfMonth(now));
            const end = normalize(endOfMonth(now));
            result = result.filter((item) => {
            if (!item.만료일) return false;
                const target = normalize(new Date(item.만료일));
                return target >= start && target <= end;
            });

        } else if (period === "지난 달") {
            const start = normalize(startOfMonth(subMonths(now, 1)));
            const end = normalize(endOfMonth(subMonths(now, 1)));
            result = result.filter((item) => {
                if (!item.만료일) return false;
                const target = normalize(new Date(item.만료일));
                return target >= start && target <= end;
            });

        } else if (period === "다음 달") {
            const start = normalize(startOfMonth(addMonths(now, 1)));
            const end = normalize(endOfMonth(addMonths(now, 1)));
            result = result.filter((item) => {
                if (!item.만료일) return false;
                const target = normalize(new Date(item.만료일));
                return target >= start && target <= end;
            });            

        } else if (period === "3개월 이내") {
            const end = new Date(now);
            end.setMonth(end.getMonth() + 3);
            result = result.filter((item) => {
            if (!item.만료일) return false;
                const target = normalize(new Date(item.만료일));
                return target >= today && target <= end;
            });

        } else if (period === "6개월 이내") {
            const end = new Date(now);
            end.setMonth(end.getMonth() + 6);
            result = result.filter((item) => {
            if (!item.만료일) return false;
                const target = normalize(new Date(item.만료일));
                return target >= today && target <= end;
            });

        } else if (period === "올해") {
            const start = normalize(startOfYear(now));
            const end = normalize(endOfYear(now));
            result = result.filter((item) => {
                if (!item.만료일) return false;
                const target = normalize(new Date(item.만료일));
                return target >= start && target <= end;
            });
            
        } else if (period === "지난 해") {
            const start = normalize(startOfYear(subYears(now, 1)));
            const end = normalize(endOfYear(subYears(now, 1)));
            result = result.filter((item) => {
                if (!item.만료일) return false;
                const target = normalize(new Date(item.만료일));
                return target >= start && target <= end;
            });

        } else if (period === "내년") {
            const start = normalize(startOfYear(addYears(now, 1)));
            const end = normalize(endOfYear(addYears(now, 1)));
            result = result.filter((item) => {
                if (!item.만료일) return false;
                const target = normalize(new Date(item.만료일));
                return target >= start && target <= end;
            });

        } else if (period === "만료된 항목") {
            result = result.filter((item) => {
            if (!item.만료일) return false;
                const target = normalize(new Date(item.만료일));
                return target < today;
            });
        }

        set검색결과(result);
    };

    // useEffect(() => {
    //     onSearch();
    // }, [period, condition]);







    return (
        <div id='main'>
            <div className="container">
                <div className="title">
                    <h2>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="1em" className="NotionIconSvgWrapper_icon__In1uC NotionIconSvgWrapper_colorTeal__YvgdY TemplateGalleryCategoryHeader_categoryIcon__Pj4uW"><defs fill="currentColor"></defs><path d="m56,13v6H22v-6h34Zm-34,22h34v-6H22v6Zm0,16h34v-6H22v6ZM12,12c-2.21,0-4,1.79-4,4s1.79,4,4,4,4-1.79,4-4-1.79-4-4-4Zm0,16c-2.21,0-4,1.79-4,4s1.79,4,4,4,4-1.79,4-4-1.79-4-4-4Zm0,16c-2.21,0-4,1.79-4,4s1.79,4,4,4,4-1.79,4-4-1.79-4-4-4Z" fill="currentColor"></path></svg>
                        To Do List
                    </h2>
                    <h3><i className="bi bi-card-list"></i>Table</h3>
                </div>

                <div className="content">
                    {/* 입력 상자 */}
                    <div className="input-container">

                        {/* 입력 상자 */}
                        <input                         
                            type="text" 
                            name='todoInput'
                            id='todoInput'
                            placeholder='+ 할 일 추 가'

                            onKeyDown={onKeyDownTodoInput}  
                            onChange={onChangeTodoInput}
                            value={state.할일}
                            ref={todoInputRef}
                        />

                        <input
                            type="datetime-local"
                            className="datetime-local"
                            value={expires}
                            onChange={(e) => setExpires(e.target.value)}
                        />

                        {/* 저장 버튼 */}
                        <button 
                            type='button'
                            className='save-btn'
                            onClick={onClickSaveBtn}
                        ><i className="bi bi-plus-lg"></i></button>

                    </div>

                    {/* 출력 목록 */}
                    <div className='todo-list-box'>
                        <div className='search-box'>
                            {/* 검색 입력 상자 */}
                            <div className="select1">
                                <select                               
                                    name="searchSelect1" 
                                    id="searchSelect1" 
                                    value={period} 
                                    onChange={(e) => setPeriod(e.target.value)}
                                >
                                    <option value="전체기간">전체기간</option>
                                    <option value="오늘">오늘</option>
                                    <option value="이번 주">이번 주</option>
                                    <option value="지난 주">지난 주</option>
                                    <option value="다음 주">다음 주</option>
                                    <option value="이번 달">이번 달</option>
                                    <option value="지난 달">지난 달</option>
                                    <option value="다음 달">다음 달</option>
                                    <option value="3개월 이내">3개월 이내</option>
                                    <option value="6개월 이내">6개월 이내</option>
                                    <option value="올해">올해</option>
                                    <option value="지난 해">지난 해</option>
                                    <option value="내년">내년</option>
                                    <option value="만료된 항목">만료된 항목</option>
                                </select>
                            </div>
                            <div className="select1 select2">
                                <select 
                                    name="searchSelect2" 
                                    id="searchSelect2" 
                                    value={condition} 
                                    onChange={(e) => setCondition(e.target.value)}
                                >
                                    <option value="할일">할일</option>
                                    <option value="만료된 항목">만료된 항목</option>
                                    <option value="완료된 항목">완료된 항목</option>
                                    <option value="삭제된 항목">삭제된 항목</option>
                                </select>
                            </div>
                            <input                         
                                type="text" 
                                name='todoSearch'
                                id='todoSearch'
                                placeholder='검색어를 입력해 주세요'
                                ref={todoSearchRef}
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                            />  
                            
                            {
                                검색결과.length === 0 ?
                            
                                (
                                    <button onClick={onSearch}><i className="bi bi-search"></i> <span>검색</span></button>
                                )
                                :
                                (
                                    <button
                                        className="reset-btn"
                                        onClick={() => {
                                        set검색결과([]);
                                        setKeyword("");
                                        setPeriod("전체기간");
                                        setCondition("할일");
                                        }}
                                    >
                                        <i className="bi bi-x-circle"></i> 초기화
                                    </button>
                                )
                            }
                            <div className="sort-group">
                                <label className="sort-label" htmlFor='sortSelect'>
                                    <i className="bi bi-sort-down"></i> 정렬
                                </label>
                            
                                <div className="select2">
                                    <div className="sort-select select1" id='sortSelect'>
                                        <select value={sort} onChange={(e)=>setSort(e.target.value)}>
                                            <option value="dateAsc">만료일 빠른순</option>
                                            <option value="dateDesc">만료일 늦은순</option>
                                            <option value="newest">최근 추가</option>
                                            <option value="oldest">오래된 추가</option>
                                        </select>
                                    </div>
                                </div> 
                            </div>     
                        </div>
                        <h2 className='count-box'>
                            <span className='left-icon'>
                                <i className="bi bi-square"></i> 할일( {삭제안된목록.length} ) / <i className="bi bi-check-square"></i> 완료( {삭제안된목록.filter((item)=>item.완료===true).length} )
                                <span className="badge bg-danger"><i className="bi bi-alarm-fill icon1 "></i><i>만료</i></span>
                                <span className="badge bg-warning text-dark"><i className="bi bi-alarm-fill icon2"></i><i>오늘</i></span>
                                <span className="badge bg-success"><i className="bi bi-alarm-fill icon3"></i><i>미래</i></span>

                            </span>
                            <span className='right-icon'>
                                <i className="bi bi-x-lg"></i> 삭제( <i>{할일목록.length - 삭제안된목록.length}</i> )
                                {
                                    (할일목록.length - 삭제안된목록.length) > 0 &&
                                    <button onClick={onClickRestore}>{showDeleted ? "할일 목록 보기" : "복구"}</button>
                                }
                            </span>
                        </h2>                            
                        <ul>
                            <li className='head'>
                                <div className="gap">
                                    <span>완료</span>    
                                    <span>만료일</span>    
                                    <span>DAY</span>    
                                    <span>할일</span>    
                                    <span>수정</span>    
                                    <span>삭제</span>    
                                </div>
                            </li>    
                            {  
                                슬라이스.length > 0 ?                       
                                슬라이스.map((item)=>
                                    <li key={item.idx}>
                                        <div className="gap">
                                            {/* 체크박스 */}
                                            <input 
                                                type="checkbox" 
                                                id={`check${item.idx}`}
                                                name={`check${item.idx}`}
                                                
                                                value={item.idx}
                                                onChange={(e)=>onChangeCheckEvent(e, item.idx)}
                                                checked={item.완료}
                                            />
                                        
                                        {
                                            (editId !==null && editId === item.idx) ?
                                                <div>
                                                    <input                         
                                                        type="text" 
                                                        name='editText'
                                                        id='editText'
                                                        placeholder='할 일 수 정'
                                                        onKeyDown={onKeyDownEditText}  
                                                        onChange={onChangeEditText}
                                                        value={editText}
                                                        ref={editTextRef}
                                                    />
                                                    <input
                                                        type="datetime-local"
                                                        className="datetime-local"
                                                        value={expires}
                                                        onChange={(e) => setExpires(e.target.value)}
                                                    />
                                                </div>
                                                :
                                                <em className='left'>
                                                    <strong
                                                        style={{
                                                            color:
                                                            !item.만료일
                                                                ? "black"
                                                                : new Date(item.만료일).setHours(0,0,0,0) < new Date().setHours(0,0,0,0)
                                                                ? "#c33"       // 만료 (빨강)
                                                                : new Date(item.만료일).setHours(0,0,0,0) === new Date().setHours(0,0,0,0)
                                                                ? "orange"     // 오늘 (D-DAY)
                                                                : "#393"       // 미래 (초록)
                                                        }}
                                                        >
                                                        {item.만료일 ? format(new Date(item.만료일), "yyyy-MM-dd HH:mm") : ""}
                                                        </strong>


                                                    <strong>
                                                        <i style={{  color: getDDay(item.만료일).color }}>{getDDay(item.만료일).label}</i>
                                                    </strong>

                                                    <a 
                                                        href='!#'
                                                        onClick={(e) => onClickEdit(e, item)}
                                                        className={(editId !== null && item.idx === editId) ? 'red' : item.완료?'on':''}
                                                    >{item.할일}</a> 

                                                   

                                                </em>
                                        }

                                            <span className='right'>
                                        {   
                                            
                                            <button className='edit' onClick={(e) => onClickEdit(e, item)}>
                                            {
                                                (editId !== null && item.idx === editId) ?
                                                <i className="bi bi-check-lg red" title='저장'></i>
                                                :
                                                <i className="bi bi-pencil"></i>
                                            }
                                            </button>
                                            
                                        }
                                            
                                        {
                                            showDeleted ? 
                                                (
                                                    <button 
                                                        onClick={(e)=>onClickRestoreBtn(e, item.idx)}
                                                        className='delete-btn'
                                                    ><i className="bi bi-arrow-counterclockwise"></i></button>
                                                )
                                                :                                    
                                                (
                                                    <button 
                                                        onClick={(e)=>onClickDeleteBtn(e, item.idx)}
                                                        className='delete-btn'
                                                    ><i className="bi bi-x-lg"></i></button>
                                                )
                                            }
                                            </span>
                                        
                                        </div>
                                    </li>    
                                
                                )
                                :
                                <li>
                                    <div className="gap">
                                        <h2>To Do List Empty...</h2> 
                                    </div>
                                </li>
                            }                                                    
                        </ul>


                        <div className="foot-button-box">
                        {     
                            // 할일목록.filter((item)=>item.완료===true).length > 0 &&                       
                            <button
                                onClick={onClickCheckDeleteBtn}
                                className={`check-delete-btn ${할일목록.filter((item)=>item.완료===true).length > 0 ? 'on':''}`}
                            >선택삭제</button>
                        }
                        </div>
                    </div>




                     {/* 페이지네이션 */}   
                    <div className="pagenation-box">

                            {/* 처음 */}
                        {    
                            현재그룹번호 > 0 &&
                            <button className="icon1"  onClick={(e)=>onClickPage(e, 1)}><i className="bi bi-chevron-bar-left"></i></button>
                        }
                            {/* 이전 */}
                        {
                            그룹시작 > 1 && 
                            <button className="icon2" onClick={(e)=>onClickPage(e, 그룹시작-1)}><i className="bi bi-chevron-left"></i></button>
                        }
                            <ul>
                            {
                                페이지번호.map((n)=>
                                    <li key={n}  data-key={n} >
                                        <a 
                                            href="!#" 
                                            title={String(n)} 
                                            /*  
                                                # String(n) 
                                                => null → "null", undefined → "undefined" 로 변환

                                                # n.toString()
                                                => n이 null 또는 undefined일 경우 TypeError 에러 발생                                                
                                            */
                                            className={page===n ? "on" : ''}
                                            onClick={(e)=>onClickPage(e, n)}
                                        >{n}</a>
                                    </li>
                                )

                            }
                            </ul>

                            {/* 다음 */}
                        {
                            그룹끝 < 총페이지수 &&
                            <button className="icon2" onClick={(e)=>onClickPage(e, 그룹끝+1)}><i className="bi bi-chevron-right"></i></button>
                        }
                            {/* 끝 */}
                        {
                            현재그룹번호 < (총그룹수-1) && 
                            <button className="icon1" onClick={(e)=>onClickPage(e, 총페이지수)}><i className="bi bi-chevron-bar-right"></i></button>
                        }

                    </div>
            
                </div>
            </div>
        </div>
    );
}