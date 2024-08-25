import internal = require('stream');
import Tree from 'ts-tree-structure';
import type { Node } from 'ts-tree-structure';;


type NodeType = { id: number, name: string, dataID: number, toolTip: string, type: number};


export class TreeUserData {

    /**
      *  インスタンス
      */
    private static _instance: TreeUserData;

    /**
     * インスタンスの取得
     */
    public static getInstance(): TreeUserData {
        // インスタンスが存在しない場合、new演算子でインスタンスを作成
        if (!this._instance) {
            this._instance = new TreeUserData(TreeUserData.getInstance);
        }

        // 生成済みのインスタンスを返す
        return this._instance;
    }


    private tree: Tree | undefined;
    private root: any | undefined;
    private count: number = 0;

    public treeItemID = {
        root: 1,                // 固定
        subject: 10,
        file: 11,
        tag: 12,
        user: 100               // これ以降を使用
    } as const;

    public treeItemType = {
        none: 0,
        comment: 3,
        warning: 2,
        error: 1
    } as const;

    /**
     * コンストラクタ
     */
    constructor(caller: Function) {
        if (caller === TreeUserData.getInstance) {
            this.tree = new Tree();
        }
        else if (TreeUserData._instance) {
            throw new Error("既にインスタンスが存在するためエラー。");
        }
        else {
            throw new Error("コンストラクタの引数が不正な為エラー。");
        }
    }

    
    public init() {

        if( !this.tree ) {
            return;
        }

        let root = this.tree.parse({
            id: 1,
            name: "",
            toolTip: "",
            type: this.treeItemType.none,
            children: [
            {
                id: 10,
                name: "Subject",
                toolTip: "",
                type: this.treeItemType.none,
                children: [],
            },
            {
                id: 11,
                name: "File",
                toolTip: "",
                type: this.treeItemType.none,
                children: [],
            },
            {
                id: 12,
                name: "Tag",
                toolTip: "",
                type: this.treeItemType.none,
                children: [],
            },
            ],
        });

        this.root = root;
    }

    private getNode(node: Node<NodeType> | undefined, id: number) : Node<NodeType> | undefined {      

        if(( !this.tree ) || (( !this.root ))){
            return;
        }
        
        if( !node ) {
            node = this.root;
            if( !node ) {
                return undefined;               
            }
        }

        for (let index = 0; index < node.children.length; index++) {
            const element = node.children[index];

            if( id === element.model.id) {
                return element;
            }
        }

        return undefined;
    }


    public addTag(folderName: string, str: string, dataId: number, level: number){
        if(( !this.tree ) || (( !this.root ))){
            return;
        }
        
        let node = this.getNode(undefined, this.treeItemID.tag);
        if( !node ) {
            return;
        }

        let isHit = false;
        for (let index = 0; index < node.children.length; index++) {
            const element = node.children[index];

            if( folderName === element.model.name) {
                node = element;
                isHit = true;
                break;
            }
        }
        if( !isHit ) {
            let idTmp = this.treeItemID.user + this.count;
            this.count++;
            node = node.addChild(this.tree.parse({ id: idTmp, name: folderName, dataID: 0, toolTip: str, type: this.treeItemType.none}));
        }

        let idTmp = this.treeItemID.user + this.count;
        this.count++;

        switch (level) {
            case this.treeItemType.comment:
               node.addChild(this.tree.parse({ id: idTmp, name: str, dataID: dataId, toolTip: str, type: this.treeItemType.comment }));
                break;

            case this.treeItemType.warning:
               node.addChild(this.tree.parse({ id: idTmp, name: str, dataID: dataId, toolTip: str, type: this.treeItemType.warning }));
                break;
                
            case this.treeItemType.error:
            default:
                node.addChild(this.tree.parse({ id: idTmp, name: str, dataID: dataId, toolTip: str, type: this.treeItemType.error }));
                break;
        }
    }

    public addSubject(folderName: string, str: string, dataId: number, level: number){
 
        if(( !this.tree ) || (( !this.root ))){
            return;
        }
 
        let node = this.getNode(undefined, this.treeItemID.subject);
        if( !node ) {
            return;
        }

        let isHit = false;
        for (let index = 0; index < node.children.length; index++) {
            const element = node.children[index];

            if( folderName === element.model.name) {
                node = element;
                isHit = true;
                break;
            }
        }
        if( !isHit ) {
            let idTmp = this.treeItemID.user + this.count;
            this.count++;
            node = node.addChild(this.tree.parse({ id: idTmp, name: folderName, dataID: 0, toolTip: str, type: this.treeItemType.none }));
        }
        
        let idTmp = this.treeItemID.user + this.count;
        this.count++;

        switch (level) {
            case this.treeItemType.comment:
               node.addChild(this.tree.parse({ id: idTmp, name: str, dataID: dataId, toolTip: str, type: this.treeItemType.comment }));
                break;

            case this.treeItemType.warning:
               node.addChild(this.tree.parse({ id: idTmp, name: str, dataID: dataId, toolTip: str, type: this.treeItemType.warning }));
                break;

            case this.treeItemType.error:
            default:
                node.addChild(this.tree.parse({ id: idTmp, name: str, dataID: dataId, toolTip: str, type: this.treeItemType.error }));
                break;
        }
   }

    public addFile(filePath: string, str: string, dataId: number, level: number){

        if(( !this.tree ) || (( !this.root ))){
            return;
        }

        // パス区切り文字で分割
        const pathArray = filePath.split(/[/\\]/);
        if( pathArray.length === 0 ) {
            return;
        }

        let pathCnt = 0;
        if( pathArray[0].length === 0 ) {
            pathCnt = 1;
        } 

        let node = this.getNode( undefined, this.treeItemID.file);
        if( !node ) {
            return;
        }

        this.addFileRecursion( 0, node, filePath, pathArray, str, pathCnt, dataId, level);
    }


    private addFileRecursion(num : number, node : Node<NodeType>, filePath: string, pathArray: string[], str: string, pathCnt: number, dataId: number, level: number){

        if(( !this.tree ) || (( !this.root ))){
            return;
        }

        if( node.children.length === 0 ) {
            for (let index2 = pathCnt; index2 < pathArray.length; index2++) {
                const element = pathArray[index2];

                let idTmp = this.treeItemID.user + this.count;
                this.count++;

                node = node.addChild(this.tree.parse({ id: idTmp, name: element, dataID: 0, toolTip: "", type: this.treeItemType.none }));
            }

            let idTmp = this.treeItemID.user + this.count;
            this.count++;

            switch (level) {
                case this.treeItemType.comment:
                   node.addChild(this.tree.parse({ id: idTmp, name: str, dataID: dataId, toolTip: str, type: this.treeItemType.comment }));
                    break;
    
                case this.treeItemType.warning:
                   node.addChild(this.tree.parse({ id: idTmp, name: str, dataID: dataId, toolTip: str, type: this.treeItemType.warning }));
                    break;
    
                case this.treeItemType.error:
                default:
                    node.addChild(this.tree.parse({ id: idTmp, name: str, dataID: dataId, toolTip: str, type: this.treeItemType.error }));
                    break;
            }
            return;
        }

        for (let index = 0; index < node.children.length; index++) {
            const element = node.children[index];

            if(element.model.name === pathArray[pathCnt] ) {
                // 一致なら次の文字へ
                pathCnt++;
                this.addFileRecursion(num + 1, element, filePath, pathArray, str, pathCnt, dataId, level);
                return;
            }
        }

        // 不一致ならNodeを追加
        for (let index2 = pathCnt; index2 < pathArray.length; index2++) {
            const element = pathArray[index2];

            let idTmp = this.treeItemID.user + this.count;
            this.count++;

            node = node.addChild(this.tree.parse({ id: idTmp, name: element, dataID: 0, toolTip: "", type: this.treeItemType.none }));                    
        }

        let idTmp = this.treeItemID.user + this.count;
        this.count++;

        switch (level) {
            case this.treeItemType.comment:
                node.addChild(this.tree.parse({ id: idTmp, name: str, dataID: dataId, toolTip: str, type: this.treeItemType.comment }));
                break;

            case this.treeItemType.warning:
                node.addChild(this.tree.parse({ id: idTmp, name: str, dataID: dataId, toolTip: str, type: this.treeItemType.warning }));
                break;

            case this.treeItemType.error:
            default:
                node.addChild(this.tree.parse({ id: idTmp, name: str, dataID: dataId, toolTip: str, type: this.treeItemType.error }));
                break;
        }

        return;
    }



    public getTreeNode(id: number): { name: string, dataID: number, toolTip: string, type: number } | undefined {

        if(( !this.tree ) || (( !this.root ))){
            return;
        }

        const idEq = (id: number) => (node: Node<NodeType>) => {
            return node.model.id === id;
        };

        let node = this.root.first(idEq(id));
        if(!node){
            return;
        }

        return { name: node.model.name, dataID: node.model.dataID, toolTip: node.model.toolTip, type: node.model.type };
    }

    public getChildrenTreeNodeList(id: number): { id: number, name: string, dataID: number, toolTip: string, type: number }[] | undefined {

        if(( !this.tree ) || (( !this.root ))){
            return;
        }

        const idEq = (id: number) => (node: Node<NodeType>) => {
            return node.model.id === id;
        };

        let node = this.root.first(idEq(id));
        if(!node){
            return;
        }

        let nodelist: { id: number, name: string; dataID: number, toolTip: string, type: number  }[] = [];

        for (let index = 0; index < node.children.length; index++) {
            const element = node.children[index];
            
            nodelist.push({id: element.model.id, name: element.model.name, dataID: element.model.dataID, toolTip: element.model.toolTip, type: element.model.type });
        }

        return nodelist;
    }


    public output() {

        if(( !this.tree ) || (( !this.root ))){
            return;
        }
        
        for (let index = 0; index < this.root.children.length; index++) {
            const element = this.root.children[index];

            console.log(element.model.id + " " + element.model.name + " " + element.model.dataID);
        
            this.outputRecursion( 1, element );
        }
    }

    private outputRecursion(num : number, node : Node<NodeType>) {

        let tab : string = "";
        for (let index = 0; index < num; index++) {
            tab += "\t";            
        }
       
        for (let index = 0; index < node.children.length; index++) {
            const element = node.children[index];
        
            console.log(tab + element.model.id + " " + element.model.name + " " + element.model.dataID);
 
            this.outputRecursion( num + 1, element );
        }
    }
}