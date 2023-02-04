import { Component, OnInit } from '@angular/core';
import { ContractService } from '../services/ContractService';
import { Alchemy, Network } from "alchemy-sdk";
import { ethers, BigNumber } from 'ethers';
import { Commit } from '../model/Commit';
import { environment } from '../../environments/environment';
import { DatePipe } from '@angular/common'; 

declare const window: any;

@Component({
  selector: 'bit-log-app',
  templateUrl: './bit-log-app.component.html',
  styleUrls: ['./bit-log-app.component.css']
})
export class BitLogAppComponent implements OnInit {

    private window: any;
    private contractJson = require("../contracts/BitLog.json");
    private web3: any = require('web3');

    private config = {
        apiKey: environment.INFURA_ARB_KEY,
        network: Network.ARB_MAINNET,
    };

    private provider = new ethers.providers.Web3Provider(window.ethereum, 'arbitrum');
    private contract_address = environment.ARB_CONTRACT_ADDR;

    private contract = new ethers.Contract(this.contract_address, JSON.stringify(this.contractJson), this.provider.getSigner());

    public address: string;
    public commitInput: string;
    public displayName: string = "";

    public commits: Commit[];

    constructor(private contractService: ContractService, public datepipe: DatePipe) {
        this.address = "";
        this.commitInput = "";
        this.commits = [];
    }

    ngOnInit(): void {

    }

    formatDate(date: Date | undefined){
        return this.datepipe.transform(date, 'dd-mm-yyyy');
       }

    public walletConnected(): boolean {
        return this.address.length > 0;
    }

    public commitsLoaded(): boolean {
        return this.commits.length > 0;
    }

    public shortAddress(): string {
        return this.address.slice(0,4) + "..." + this.address.slice(38,42)
    }

    disconnect() {
        this.address = '';
    }

    commitInputChange(e: any) {
        console.log(e);
    }

    public logCommit(e: any) {
        e.preventDefault();
        this.writeCommit();
    }

    public async writeCommit() {
        const connect = await this.contract.connect(this.provider);
        console.log(this.commitInput);
        await this.contract['addCommit'](BigNumber.from(this.commitInput).toHexString(), BigNumber.from(this.address).toHexString);
    }

    public async getCommits(address: string) {
        const numCommits = await this.contract['getNumCommits'](this.address);
        const allCommits = await this.contract['getAllCommits'](this.address, numCommits);
        for (let i = 0; i < allCommits.length; i++) {
            const id = await this.contract['getCommitId'](allCommits[i]);
            this.commits.push(new Commit(this.address, this.address, id));
        }
        this.setTimestamps(this.commits);
    }

    public async setTimestamps(commits: Commit[]) {
        for (let i = 0; i < commits.length; i++) {
            const timestamp = await this.contract['getCommitTime'](commits[i].commitId);
            commits[i].setTimestamp(timestamp);
            commits[i].setDate(Number.parseInt(timestamp.toString()) * 1000);
        }
    }

    public viewAddress(e: any) {
        e.preventDefault();
        this.commits = [];
        this.getCommits(this.address);
    }
        
    openMetamask(){
        this.contractService.openMetamask().then(resp =>{
            this.address = resp;
            this.setDisplayName(resp);
    })}

    public setDisplayName(addr: any) {
        this.displayName = addr;
    }

}

