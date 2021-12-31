import "reflect-metadata";
import { BaseEntity, Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Repository extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ type: "varchar" })
  date: string;

  @Column({ type: "varchar" })
  language: string;

  @Column({ type: "int" })
  stargazers: number;

  @Column({ type: "int" })
  starsToday: number;

  @Column({ type: "varchar" })
  description: string;

  @Column({ type: "varchar" })
  owner: string;

  @Column({ type: "varchar" })
  name: string;

  @Column({ type: "varchar" })
  url: string;
}
