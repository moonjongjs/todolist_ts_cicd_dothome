import { useNavigate } from "react-router-dom";

export default function useCustomHook(){

    const navigate = useNavigate();

    const onClickALink=(
        e: React.MouseEvent<HTMLAnchorElement>,
        pathName: string | null, 
        data?: any
        )=>{
        e.preventDefault();

        console.log( pathName)

        if(pathName===null) return;
                
        if(/^https?:\/\//.test(pathName)){
            console.log('외부링크 패스네임', pathName)
        }
        else {
            console.log('내부링크 패스네임', pathName)
            navigate(pathName);
        }   

        window.scrollTo({top: 0, left: 0, 'behavior': 'smooth'})   

    }

    return {
        onClickALink
    };
    
}